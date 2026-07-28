package content

import (
	"fmt"
	"net/url"
	"path/filepath"
	"strings"
)

func (i ContentInput) Validate() error {
	if strings.TrimSpace(i.Title) == "" || len(i.Title) > 240 {
		return fmt.Errorf("title is required and must be at most 240 characters")
	}
	if i.Slug != "" {
		if err := ValidateSlug(i.Slug); err != nil {
			return err
		}
	}
	return nil
}

func (i ProjectInput) Validate() error {
	if err := i.ContentInput.Validate(); err != nil {
		return err
	}
	if err := validateSummary(i.Summary, 500); err != nil {
		return fmt.Errorf("summary: %w", err)
	}
	if strings.TrimSpace(i.Outcome) == "" {
		return fmt.Errorf("outcome is required")
	}
	if len(i.Outcome) > 1000 {
		return fmt.Errorf("outcome must be at most 1000 characters")
	}
	if i.Stage != "" && !validProjectStage(i.Stage) {
		return fmt.Errorf("invalid project stage %q", i.Stage)
	}
	if i.Availability != "" && !validAvailability(i.Availability) {
		return fmt.Errorf("invalid project availability %q", i.Availability)
	}
	if len(i.Links) > 32 {
		return fmt.Errorf("a project may have at most 32 links")
	}
	for n, link := range i.Links {
		if err := link.Validate(); err != nil {
			return fmt.Errorf("links[%d]: %w", n, err)
		}
	}
	return nil
}

func (i PostInput) Validate() error {
	if err := i.ContentInput.Validate(); err != nil {
		return err
	}
	if err := validateSummary(i.Summary, 1000); err != nil {
		return fmt.Errorf("summary: %w", err)
	}
	if i.ReadingTimeMinutes < 0 {
		return fmt.Errorf("reading time cannot be negative")
	}
	if i.ReadingTimeMinutes != 0 && i.ReadingTimeMinutes != i.DerivedReadingTime() {
		return fmt.Errorf("reading time must match the Markdown content")
	}
	return nil
}

func validateSummary(summary string, max int) error {
	if strings.TrimSpace(summary) == "" {
		return fmt.Errorf("is required")
	}
	if len(summary) > max {
		return fmt.Errorf("must be at most %d characters", max)
	}
	return nil
}

func validProjectStage(stage ProjectStage) bool {
	return stage == ProjectCurrent || stage == ProjectCompleted || stage == ProjectArchived
}

func validAvailability(availability ProjectAvailability) bool {
	return availability == AvailabilityPublic || availability == AvailabilityPrivate
}

func (link ProjectLink) Validate() error {
	switch link.Kind {
	case "github", "live_demo", "related_blog", "paper", "other":
	default:
		return fmt.Errorf("invalid project link kind %q", link.Kind)
	}
	if strings.TrimSpace(link.Label) == "" || len(link.Label) > 120 {
		return fmt.Errorf("label is required and must be at most 120 characters")
	}
	return validateHTTPURL(link.URL)
}

func (p PostInput) DerivedReadingTime() int { return ReadingTimeMinutes(p.BodyMarkdown) }

func (p PostInput) EffectiveReadingTime() int {
	if p.ReadingTimeMinutes > 0 {
		return p.ReadingTimeMinutes
	}
	return p.DerivedReadingTime()
}

func (i ProfileInput) Validate() error {
	if strings.TrimSpace(i.Name) == "" || len(i.Name) > 160 {
		return fmt.Errorf("name is required and must be at most 160 characters")
	}
	if len(i.Headline) > 240 {
		return fmt.Errorf("headline must be at most 240 characters")
	}
	if len(i.Education) > 240 || len(i.CurrentRole) > 240 || len(i.Statement) > 500 {
		return fmt.Errorf("profile education/role must be at most 240 characters and statement at most 500")
	}
	return nil
}

func (i ContactLinkInput) Validate() error {
	if strings.TrimSpace(i.Label) == "" || len(i.Label) > 80 {
		return fmt.Errorf("label is required and must be at most 80 characters")
	}
	if strings.TrimSpace(i.IconKey) == "" || len(i.IconKey) > 80 {
		return fmt.Errorf("icon_key is required and must be at most 80 characters")
	}
	switch i.Kind {
	case ContactExternal:
		return validateHTTPURL(i.URL)
	case ContactEmail:
		if !strings.HasPrefix(strings.ToLower(i.URL), "mailto:") {
			return fmt.Errorf("email contact URL must use mailto:")
		}
		address := strings.TrimPrefix(i.URL, "mailto:")
		if !strings.Contains(address, "@") || strings.ContainsAny(address, " \t\r\n") {
			return fmt.Errorf("invalid email contact URL")
		}
		return nil
	default:
		return fmt.Errorf("invalid contact link kind %q", i.Kind)
	}
}

func (i MediaInput) Validate() error {
	if filepath.Base(i.OriginalName) != i.OriginalName || i.OriginalName == "" {
		return fmt.Errorf("invalid original filename")
	}
	if i.SizeBytes <= 0 {
		return fmt.Errorf("media size must be positive")
	}
	if i.SizeBytes > 25*1024*1024 {
		return fmt.Errorf("media exceeds 25 MiB limit")
	}
	if !allowedMIME[i.MIMEType] {
		return fmt.Errorf("unsupported media type %q", i.MIMEType)
	}
	if i.Width < 0 || i.Height < 0 {
		return fmt.Errorf("media dimensions cannot be negative")
	}
	return nil
}

var allowedMIME = map[string]bool{"image/jpeg": true, "image/png": true, "image/webp": true, "image/gif": true, "application/pdf": true}

func validateHTTPURL(raw string) error {
	u, err := url.Parse(raw)
	if err != nil || (u.Scheme != "https" && u.Scheme != "http") || u.Host == "" {
		return fmt.Errorf("must be an absolute http(s) URL")
	}
	return nil
}
