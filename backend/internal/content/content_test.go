package content

import (
	"context"
	"encoding/json"
	"strings"
	"testing"
	"time"
)

func TestGenerateAndValidateSlug(t *testing.T) {
	if got := GenerateSlug("  Go & PostgreSQL: A Tour! "); got != "go-postgresql-a-tour" {
		t.Fatalf("slug = %q", got)
	}
	if err := ValidateSlug("Bad Slug"); err == nil {
		t.Fatal("expected invalid slug")
	}
}

func TestSlugImmutableAfterPublication(t *testing.T) {
	now := time.Date(2026, 1, 1, 12, 0, 0, 0, time.UTC)
	future := now.Add(time.Hour)
	scheduled := Content{Status: StatusScheduled, PublishAt: &future}
	if err := ValidateSlugChange("old-slug", "new-slug", scheduled, now); err != nil {
		t.Fatalf("scheduled content should remain editable before publish_at: %v", err)
	}
	if err := ValidateSlugChange("old-slug", "new-slug", scheduled, future); err == nil {
		t.Fatal("eligible scheduled content must have an immutable slug")
	}
	if err := ValidateSlugChange("old-slug", "new-slug", Content{Status: StatusPublished}, now); err == nil {
		t.Fatal("expected immutable slug error")
	}
	if err := ValidateSlugChange("old-slug", "old-slug", scheduled, future); err != nil {
		t.Fatal(err)
	}
	project := Project{Content: scheduled, Availability: AvailabilityPrivate}
	if project.PublicContent(future) {
		t.Fatal("private project should not be public")
	}
	if err := ValidateProjectSlugChange("old-slug", "new-slug", project, future); err == nil {
		t.Fatal("editorially public private project must still have an immutable canonical slug")
	}
	project.Availability = AvailabilityPublic
	if err := ValidateProjectSlugChange("old-slug", "new-slug", project, future); err == nil {
		t.Fatal("public scheduled project must have an immutable slug")
	}
}

func TestLifecycleAndPublicEligibility(t *testing.T) {
	now := time.Date(2026, 1, 1, 12, 0, 0, 0, time.UTC)
	publishAt := now.Add(time.Hour)
	c := Content{Status: StatusDraft, PublishAt: &publishAt}
	var err error
	c, err = c.Transition(StatusScheduled, now)
	if err != nil {
		t.Fatal(err)
	}
	if c.PublicContent(now) || !c.PublicContent(publishAt) {
		t.Fatal("scheduled eligibility incorrect")
	}
	c, err = c.Transition(StatusPublished, publishAt)
	if err != nil || c.PublishedAt == nil {
		t.Fatalf("publish transition: %v", err)
	}
	if !c.PublicContent(now) {
		t.Fatal("published content should be public")
	}
	if _, err = c.Transition(StatusDraft, now); err == nil {
		t.Fatal("published content must not return to draft")
	}
	if c2, err := c.Transition(StatusArchived, publishAt); err != nil || c2.ArchivedAt == nil {
		t.Fatalf("archive transition: %v", err)
	}
	if _, err := c.Transition(StatusDraft, publishAt); err == nil {
		t.Fatal("published content must not return to draft")
	}
	if _, err := (Content{Status: StatusDraft, PublishAt: &publishAt}).Transition(StatusDraft, now); err == nil {
		t.Fatal("same-state transition should validate stale metadata")
	}
}

func TestInputValidation(t *testing.T) {
	if err := (ProjectInput{ContentInput: ContentInput{Title: "x"}, Outcome: "done"}).Validate(); err == nil {
		t.Fatal("expected required summary error")
	}
	if err := (ProjectInput{ContentInput: ContentInput{Title: "x", Summary: "ok"}, Outcome: "done", Links: []ProjectLink{{Kind: "github", Label: "repo", URL: "javascript:alert(1)"}}}).Validate(); err == nil {
		t.Fatal("expected link URL validation error")
	}
	if err := (PostInput{ContentInput: ContentInput{Title: "x", Summary: strings.Repeat("x", 1001)}}).Validate(); err == nil {
		t.Fatal("expected post summary length error")
	}
	if err := (MediaInput{OriginalName: "../secret", MIMEType: "image/png", SizeBytes: 10}).Validate(); err == nil {
		t.Fatal("expected filename validation error")
	}
	if err := (ProfileInput{Name: "Site Owner"}).Validate(); err != nil {
		t.Fatalf("profile should allow an empty optional headline: %v", err)
	}
}

func TestReadingTime(t *testing.T) {
	if got := ReadingTimeMinutes(strings.Repeat("word ", 201)); got != 2 {
		t.Fatalf("reading time = %d", got)
	}
	p := PostInput{ContentInput: ContentInput{BodyMarkdown: "one two three"}}
	if p.DerivedReadingTime() != 1 || p.EffectiveReadingTime() != 1 {
		t.Fatal("expected derived reading time")
	}
	if err := (PostInput{ContentInput: ContentInput{Title: "x", Summary: "summary", BodyMarkdown: "one"}, ReadingTimeMinutes: 3}).Validate(); err == nil {
		t.Fatal("expected stale reading time to be rejected")
	}
}

func TestPublicDTODoesNotExposeEditorialFields(t *testing.T) {
	data, err := json.Marshal(ProjectDTO{Title: "Public"})
	if err != nil {
		t.Fatal(err)
	}
	encoded := string(data)
	if strings.Contains(encoded, "body_markdown") || strings.Contains(encoded, "\"status\"") {
		t.Fatalf("public DTO exposed editorial data: %s", encoded)
	}
}

func TestGoldmarkRendererSanitizesHTML(t *testing.T) {
	r := NewGoldmarkRenderer()
	html, err := r.Render(context.Background(), "# Hello\n\n<script>alert(1)</script>\n\n**bold**")
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(strings.ToLower(html), "<script") || !strings.Contains(html, "<h1") {
		t.Fatalf("unsafe or incomplete HTML: %s", html)
	}
}
