//go:build integration

package database

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"os"
	"testing"
	"time"

	db "github.com/AliAlfridawi/portfolioWebsite/backend/db/generated"
	"github.com/AliAlfridawi/portfolioWebsite/backend/internal/auth"
	"github.com/AliAlfridawi/portfolioWebsite/backend/internal/content"
	"github.com/AliAlfridawi/portfolioWebsite/backend/internal/httpapi"
	"github.com/jackc/pgx/v5/pgxpool"
)

func TestPostgresContentLifecycle(t *testing.T) {
	databaseURL := os.Getenv("PORTFOLIO_TEST_DATABASE_URL")
	if databaseURL == "" {
		t.Skip("PORTFOLIO_TEST_DATABASE_URL is not set")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()

	queries := db.New(pool)
	suffix := fmt.Sprintf("%d", time.Now().UnixNano())
	passwordHash, err := auth.HashPasswordWithParams("integration-password", auth.Argon2idParams{
		Memory: 16 * 1024, Iterations: 1, Parallelism: 1, SaltLength: 16, KeyLength: 32,
	})
	if err != nil {
		t.Fatal(err)
	}
	user, err := queries.CreateUser(ctx, db.CreateUserParams{
		Email: "integration-" + suffix + "@example.test", PasswordHash: passwordHash,
		DisplayName: "Integration", Role: db.UserRoleAdmin,
	})
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = queries.DeleteUser(context.Background(), user.ID) })

	tag, err := queries.CreateTaxonomyTerm(ctx, db.CreateTaxonomyTermParams{
		Kind: db.TaxonomyKindTag, Name: "Tag " + suffix, Slug: "tag-" + suffix,
	})
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _, _ = queries.DeleteTaxonomyTerm(context.Background(), tag.ID) })
	category, err := queries.CreateTaxonomyTerm(ctx, db.CreateTaxonomyTermParams{
		Kind: db.TaxonomyKindCategory, Name: "Category " + suffix, Slug: "category-" + suffix,
	})
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _, _ = queries.DeleteTaxonomyTerm(context.Background(), category.ID) })

	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	_ = logger
	adapters := NewAdapters(pool, content.NewGoldmarkRenderer())
	projectInput := content.ProjectInput{
		ContentInput: content.ContentInput{
			Title: "Integration project", Slug: "integration-project-" + suffix,
			Summary: "Database-backed integration project.", BodyMarkdown: "# Safe\n\n<script>bad()</script>",
			TagIDs: []string{uuidString(tag.ID)}, CategoryIDs: []string{uuidString(category.ID)},
		},
		Outcome: "Verified lifecycle.", Stage: content.ProjectCurrent,
		Availability: content.AvailabilityPublic,
		Links: []content.ProjectLink{{
			Kind: "github", Label: "Repository", URL: "https://example.test/repository",
		}},
	}
	project, err := adapters.CreateProject(ctx, uuidString(user.ID), projectInput, content.StatusDraft)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = adapters.DeleteProject(context.Background(), project.ID, uuidString(user.ID)) })
	if _, err := adapters.GetProject(ctx, project.Slug); !errors.Is(err, httpapi.ErrNotFound) {
		t.Fatalf("draft public lookup error = %v, want not found", err)
	}

	projectInput.ExpectedUpdatedAt = &project.UpdatedAt
	published, err := adapters.UpdateProject(ctx, project.ID, uuidString(user.ID), projectInput, content.StatusPublished)
	if err != nil {
		t.Fatal(err)
	}
	public, err := adapters.GetProject(ctx, published.Slug)
	if err != nil {
		t.Fatal(err)
	}
	if public.BodyHTML == "" || public.BodyMarkdown != "" {
		t.Fatalf("public project Markdown/HTML boundary is incorrect: %#v", public.Content)
	}

	secondProjectInput := projectInput
	secondProjectInput.Title = "Second integration project"
	secondProjectInput.Slug = "second-integration-project-" + suffix
	secondProjectInput.CategoryIDs = nil
	secondProjectInput.ExpectedUpdatedAt = nil
	secondProject, err := adapters.CreateProject(ctx, uuidString(user.ID), secondProjectInput, content.StatusPublished)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = adapters.DeleteProject(context.Background(), secondProject.ID, uuidString(user.ID)) })

	tagFilter := httpapi.PublicFilters{Tags: []string{"missing-" + suffix, tag.Slug}}
	firstPage, projectTotal, err := adapters.ListProjects(ctx, httpapi.Page{Limit: 1}, tagFilter)
	if err != nil {
		t.Fatal(err)
	}
	if projectTotal != 2 || len(firstPage) != 1 {
		t.Fatalf("filtered project first page count = %d/%d, want 1/2", len(firstPage), projectTotal)
	}
	secondPage, secondPageTotal, err := adapters.ListProjects(ctx, httpapi.Page{Limit: 1, Offset: 1}, tagFilter)
	if err != nil {
		t.Fatal(err)
	}
	if secondPageTotal != 2 || len(secondPage) != 1 || secondPage[0].ID == firstPage[0].ID {
		t.Fatalf("filtered project second page = %#v total %d", secondPage, secondPageTotal)
	}
	repeatedFirstPage, _, err := adapters.ListProjects(ctx, httpapi.Page{Limit: 1}, tagFilter)
	if err != nil {
		t.Fatal(err)
	}
	if len(repeatedFirstPage) != 1 || repeatedFirstPage[0].ID != firstPage[0].ID {
		t.Fatalf("filtered project ordering changed: %#v then %#v", firstPage, repeatedFirstPage)
	}
	projectsInBothKinds, bothKindsTotal, err := adapters.ListProjects(ctx, httpapi.Page{Limit: 10}, httpapi.PublicFilters{
		Tags: []string{tag.Slug}, Categories: []string{category.Slug},
	})
	if err != nil {
		t.Fatal(err)
	}
	if bothKindsTotal != 1 || len(projectsInBothKinds) != 1 || projectsInBothKinds[0].ID != project.ID {
		t.Fatalf("combined project filters = %#v total %d", projectsInBothKinds, bothKindsTotal)
	}
	noProjects, noProjectsTotal, err := adapters.ListProjects(ctx, httpapi.Page{Limit: 10}, httpapi.PublicFilters{
		Tags: []string{"missing-" + suffix},
	})
	if err != nil {
		t.Fatal(err)
	}
	if noProjectsTotal != 0 || len(noProjects) != 0 {
		t.Fatalf("unknown project filter = %#v total %d", noProjects, noProjectsTotal)
	}

	projectInput.Title = "Stale overwrite"
	projectInput.ExpectedUpdatedAt = &project.UpdatedAt
	if _, err := adapters.UpdateProject(ctx, project.ID, uuidString(user.ID), projectInput, content.StatusPublished); !errors.Is(err, httpapi.ErrConflict) {
		t.Fatalf("stale update error = %v, want conflict", err)
	}

	future := time.Now().Add(24 * time.Hour)
	postInput := content.PostInput{ContentInput: content.ContentInput{
		Title: "Scheduled integration post", Slug: "integration-post-" + suffix,
		Summary: "Scheduled content remains private.", BodyMarkdown: "Future content.", PublishAt: &future,
		TagIDs: []string{uuidString(tag.ID)}, CategoryIDs: []string{uuidString(category.ID)},
	}}
	post, err := adapters.CreatePost(ctx, uuidString(user.ID), postInput, content.StatusScheduled)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = adapters.DeletePost(context.Background(), post.ID, uuidString(user.ID)) })
	if _, err := adapters.GetPost(ctx, post.Slug); !errors.Is(err, httpapi.ErrNotFound) {
		t.Fatalf("future post public lookup error = %v, want not found", err)
	}

	publishedPostInput := postInput
	publishedPostInput.Title = "Published integration post"
	publishedPostInput.Slug = "published-integration-post-" + suffix
	publishedPostInput.Summary = "Published content is filterable."
	publishedPostInput.PublishAt = nil
	publishedPost, err := adapters.CreatePost(ctx, uuidString(user.ID), publishedPostInput, content.StatusPublished)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = adapters.DeletePost(context.Background(), publishedPost.ID, uuidString(user.ID)) })

	filteredPosts, postTotal, err := adapters.ListPosts(ctx, httpapi.Page{Limit: 1}, httpapi.PublicFilters{
		Tags: []string{"missing-" + suffix, tag.Slug}, Categories: []string{category.Slug},
	})
	if err != nil {
		t.Fatal(err)
	}
	if postTotal != 1 || len(filteredPosts) != 1 || filteredPosts[0].ID != publishedPost.ID {
		t.Fatalf("filtered posts = %#v total %d", filteredPosts, postTotal)
	}
	noPosts, noPostsTotal, err := adapters.ListPosts(ctx, httpapi.Page{Limit: 10}, httpapi.PublicFilters{
		Categories: []string{"missing-" + suffix},
	})
	if err != nil {
		t.Fatal(err)
	}
	if noPostsTotal != 0 || len(noPosts) != 0 {
		t.Fatalf("unknown post filter = %#v total %d", noPosts, noPostsTotal)
	}
}
