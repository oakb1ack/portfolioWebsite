package database

// This file is the boundary between sqlc and the domain/HTTP packages.  No
// generated row or pgtype value is allowed to escape this package.
import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"time"

	db "github.com/AliAlfridawi/portfolioWebsite/backend/db/generated"
	"github.com/AliAlfridawi/portfolioWebsite/backend/internal/auth"
	"github.com/AliAlfridawi/portfolioWebsite/backend/internal/content"
	"github.com/AliAlfridawi/portfolioWebsite/backend/internal/httpapi"
	mediastore "github.com/AliAlfridawi/portfolioWebsite/backend/internal/media"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Adapters struct {
	Pool       *pgxpool.Pool
	Queries    *db.Queries
	Renderer   content.MarkdownRenderer
	MediaFiles *mediastore.Store
}

func (a *Adapters) AttachMediaStore(store *mediastore.Store) {
	a.MediaFiles = store
}

func NewAdapters(pool *pgxpool.Pool, renderer content.MarkdownRenderer) *Adapters {
	if renderer == nil {
		renderer = content.NewGoldmarkRenderer()
	}
	return &Adapters{Pool: pool, Queries: db.New(pool), Renderer: renderer}
}

var _ httpapi.PublicStore = (*Adapters)(nil)
var _ httpapi.ContentAdminStore = (*Adapters)(nil)
var _ httpapi.AuthStore = (*Adapters)(nil)
var _ httpapi.MediaStore = (*Adapters)(nil)

func mapDBError(err error) error {
	if err == nil {
		return nil
	}
	if errors.Is(err, pgx.ErrNoRows) {
		return httpapi.ErrNotFound
	}
	var pe *pgconn.PgError
	if errors.As(err, &pe) {
		switch pe.Code {
		case "23505", "23503", "23514":
			return httpapi.ErrConflict
		}
	}
	return err
}
func uuidValue(s string) (pgtype.UUID, error) {
	var u pgtype.UUID
	if err := u.Scan(s); err != nil {
		return pgtype.UUID{}, fmt.Errorf("invalid UUID: %w", err)
	}
	return u, nil
}
func uuidString(u pgtype.UUID) string {
	if !u.Valid {
		return ""
	}
	return fmt.Sprintf("%x-%x-%x-%x-%x", u.Bytes[0:4], u.Bytes[4:6], u.Bytes[6:8], u.Bytes[8:10], u.Bytes[10:16])
}
func timeValue(t pgtype.Timestamptz) *time.Time {
	if !t.Valid {
		return nil
	}
	v := t.Time
	return &v
}
func ts(t *time.Time) pgtype.Timestamptz {
	if t == nil {
		return pgtype.Timestamptz{}
	}
	return pgtype.Timestamptz{Time: *t, Valid: true}
}
func expectedAt(current pgtype.Timestamptz, expected *time.Time) pgtype.Timestamptz {
	if expected != nil {
		return ts(expected)
	}
	return current
}
func uuidPtr(s *string) pgtype.UUID {
	if s == nil || *s == "" {
		return pgtype.UUID{}
	}
	u, _ := uuidValue(*s)
	return u
}
func optionalUUID(s *string) (pgtype.UUID, error) {
	if s == nil || *s == "" {
		return pgtype.UUID{}, nil
	}
	u, err := uuidValue(*s)
	if err != nil {
		return pgtype.UUID{}, httpapi.ErrConflict
	}
	return u, nil
}
func stringPtr(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
func nullableString(value string) *string {
	if value == "" {
		return nil
	}
	return &value
}
func nonNilStrings(values []string) []string {
	if values == nil {
		return []string{}
	}
	return values
}
func uuidList(in []string) ([]pgtype.UUID, error) {
	out := make([]pgtype.UUID, 0, len(in))
	for _, s := range in {
		u, e := uuidValue(s)
		if e != nil {
			return nil, e
		}
		out = append(out, u)
	}
	return out, nil
}
func statusValue(s content.Status) db.ContentStatus { return db.ContentStatus(s) }
func validStatus(s content.Status) bool {
	return s == content.StatusDraft || s == content.StatusScheduled || s == content.StatusPublished || s == content.StatusArchived
}
func statusTimes(status content.Status, publish *time.Time, now time.Time) (*time.Time, error) {
	if !validStatus(status) {
		return nil, fmt.Errorf("invalid content status")
	}
	if status == content.StatusScheduled && (publish == nil || !publish.After(now)) {
		return nil, fmt.Errorf("scheduled content requires a future publish_at")
	}
	if status == content.StatusPublished && publish == nil {
		publish = &now
	}
	if status == content.StatusDraft || status == content.StatusArchived {
		publish = nil
	}
	return publish, nil
}

func transitionPublishAt(oldStatus content.Status, oldPublish, oldPublished, oldArchived *time.Time, target content.Status, requested *time.Time, now time.Time) (*time.Time, error) {
	if !validStatus(target) {
		return nil, errors.New("invalid content status")
	}
	current := content.Content{
		Status: oldStatus, PublishAt: oldPublish, PublishedAt: oldPublished, ArchivedAt: oldArchived,
	}
	if target == oldStatus {
		if requested != nil {
			current.PublishAt = requested
		}
		if err := current.ValidateLifecycle(); err != nil {
			return nil, err
		}
		return current.PublishAt, nil
	}
	if target == content.StatusPublished && requested == nil {
		requested = oldPublish
		if requested == nil {
			requested = &now
		}
	}
	current.PublishAt = requested
	next, err := current.Transition(target, now)
	if err != nil {
		return nil, err
	}
	return next.PublishAt, nil
}

func publicProjectParams(p httpapi.Page, filters httpapi.PublicFilters) (db.ListPublicProjectsParams, db.CountPublicProjectsParams) {
	count := db.CountPublicProjectsParams{
		TagSlugs:      nonNilStrings(filters.Tags),
		CategorySlugs: nonNilStrings(filters.Categories),
	}
	list := db.ListPublicProjectsParams{
		TagSlugs: count.TagSlugs, CategorySlugs: count.CategorySlugs,
		OffsetCount: int32(p.Offset), LimitCount: int32(p.Limit),
	}
	return list, count
}

func (a *Adapters) ListProjects(ctx context.Context, p httpapi.Page, filters httpapi.PublicFilters) ([]content.Project, int64, error) {
	listParams, countParams := publicProjectParams(p, filters)
	rows, e := a.Queries.ListPublicProjects(ctx, listParams)
	if e != nil {
		return nil, 0, mapDBError(e)
	}
	n, e := a.Queries.CountPublicProjects(ctx, countParams)
	if e != nil {
		return nil, 0, mapDBError(e)
	}
	out := make([]content.Project, 0, len(rows))
	for _, r := range rows {
		v, e := publicProject(r)
		if e != nil {
			return nil, 0, e
		}
		out = append(out, v)
	}
	return out, n, nil
}
func (a *Adapters) GetProject(ctx context.Context, slug string) (content.Project, error) {
	r, e := a.Queries.GetPublicProjectBySlug(ctx, slug)
	if e != nil {
		return content.Project{}, mapDBError(e)
	}
	return publicProjectDetail(r)
}

func publicPostParams(p httpapi.Page, filters httpapi.PublicFilters) (db.ListPublicPostsParams, db.CountPublicPostsParams) {
	count := db.CountPublicPostsParams{
		TagSlugs:      nonNilStrings(filters.Tags),
		CategorySlugs: nonNilStrings(filters.Categories),
	}
	list := db.ListPublicPostsParams{
		TagSlugs: count.TagSlugs, CategorySlugs: count.CategorySlugs,
		OffsetCount: int32(p.Offset), LimitCount: int32(p.Limit),
	}
	return list, count
}

func (a *Adapters) ListPosts(ctx context.Context, p httpapi.Page, filters httpapi.PublicFilters) ([]content.BlogPost, int64, error) {
	listParams, countParams := publicPostParams(p, filters)
	rows, e := a.Queries.ListPublicPosts(ctx, listParams)
	if e != nil {
		return nil, 0, mapDBError(e)
	}
	n, e := a.Queries.CountPublicPosts(ctx, countParams)
	if e != nil {
		return nil, 0, mapDBError(e)
	}
	out := make([]content.BlogPost, 0, len(rows))
	for _, r := range rows {
		out = append(out, publicPost(r))
	}
	return out, n, nil
}
func (a *Adapters) GetPost(ctx context.Context, slug string) (content.BlogPost, error) {
	r, e := a.Queries.GetPublicPostBySlug(ctx, slug)
	if e != nil {
		return content.BlogPost{}, mapDBError(e)
	}
	return publicPostDetail(r), nil
}
func (a *Adapters) GetProfile(ctx context.Context) (content.Profile, error) {
	r, e := a.Queries.GetPublicProfile(ctx)
	if e != nil {
		return content.Profile{}, mapDBError(e)
	}
	return publicProfile(r), nil
}
func (a *Adapters) ListContactLinks(ctx context.Context) ([]content.ContactLink, error) {
	rs, e := a.Queries.ListPublicContactLinks(ctx)
	if e != nil {
		return nil, mapDBError(e)
	}
	out := make([]content.ContactLink, 0, len(rs))
	for _, r := range rs {
		out = append(out, content.ContactLink{ID: uuidString(r.ID), Label: r.Label, Kind: content.ContactLinkKind(r.Kind), URL: r.Url, IconKey: stringPtr(r.IconKey), SortOrder: int(r.SortOrder), IsVisible: true})
	}
	return out, nil
}

func (a *Adapters) ListAdminMedia(ctx context.Context, page httpapi.Page) ([]content.Media, int64, error) {
	rows, err := a.Queries.ListMediaAssets(ctx, db.ListMediaAssetsParams{Limit: int32(page.Limit), Offset: int32(page.Offset)})
	if err != nil {
		return nil, 0, mapDBError(err)
	}
	total, err := a.Queries.CountMediaAssets(ctx)
	if err != nil {
		return nil, 0, mapDBError(err)
	}
	items := make([]content.Media, 0, len(rows))
	for _, row := range rows {
		items = append(items, mediaAsset(row))
	}
	return items, total, nil
}

func (a *Adapters) CreateMedia(ctx context.Context, adminID, originalName string, source io.Reader, altText string) (content.Media, error) {
	if a.MediaFiles == nil {
		return content.Media{}, errors.New("media filesystem is unavailable")
	}
	uploader, err := uuidValue(adminID)
	if err != nil {
		return content.Media{}, httpapi.ErrNotFound
	}
	stored, err := a.MediaFiles.Save(ctx, originalName, source)
	if err != nil {
		if errors.Is(err, mediastore.ErrTooLarge) || errors.Is(err, mediastore.ErrUnsupportedType) {
			return content.Media{}, httpapi.ErrConflict
		}
		return content.Media{}, err
	}
	row, err := a.Queries.CreateMediaAsset(ctx, db.CreateMediaAssetParams{
		UploadedBy: uploader, StorageKey: stored.StorageKey, OriginalFilename: stored.OriginalName,
		MimeType: stored.MIMEType, ByteSize: stored.SizeBytes, Sha256: stored.SHA256[:],
		Width: positiveInt32(stored.Width), Height: positiveInt32(stored.Height), AltText: nullableString(altText),
	})
	if err != nil {
		_ = a.MediaFiles.Delete(stored.StorageKey)
		return content.Media{}, mapDBError(err)
	}
	return mediaAsset(row), nil
}

func (a *Adapters) OpenPublicMedia(ctx context.Context, id string) (content.Media, io.ReadSeekCloser, error) {
	if a.MediaFiles == nil {
		return content.Media{}, nil, errors.New("media filesystem is unavailable")
	}
	mediaID, err := uuidValue(id)
	if err != nil {
		return content.Media{}, nil, httpapi.ErrNotFound
	}
	row, err := a.Queries.GetPublicMediaAsset(ctx, mediaID)
	if err != nil {
		return content.Media{}, nil, mapDBError(err)
	}
	file, err := a.MediaFiles.Open(row.StorageKey)
	if err != nil {
		return content.Media{}, nil, err
	}
	return mediaAsset(row), file, nil
}

func (a *Adapters) DeleteMedia(ctx context.Context, id string) error {
	if a.MediaFiles == nil {
		return errors.New("media filesystem is unavailable")
	}
	mediaID, err := uuidValue(id)
	if err != nil {
		return httpapi.ErrNotFound
	}
	row, err := a.Queries.GetMediaAsset(ctx, mediaID)
	if err != nil {
		return mapDBError(err)
	}
	affected, err := a.Queries.DeleteMediaAsset(ctx, mediaID)
	if err != nil {
		return mapDBError(err)
	}
	if affected == 0 {
		return httpapi.ErrConflict
	}
	if err := a.MediaFiles.Delete(row.StorageKey); err != nil {
		return err
	}
	return nil
}

func mediaAsset(row db.MediaAsset) content.Media {
	return content.Media{
		ID: uuidString(row.ID), OriginalName: row.OriginalFilename, StorageKey: row.StorageKey,
		PublicURL: "/api/v1/media/" + uuidString(row.ID), MIMEType: row.MimeType,
		SizeBytes: row.ByteSize, Width: intValue(row.Width), Height: intValue(row.Height),
		AltText: stringPtr(row.AltText), CreatedAt: row.CreatedAt.Time, UpdatedAt: row.UpdatedAt.Time,
	}
}

func positiveInt32(value int) *int32 {
	if value <= 0 {
		return nil
	}
	converted := int32(value)
	return &converted
}

func intValue(value *int32) int {
	if value == nil {
		return 0
	}
	return int(*value)
}

func publicProject(r db.ListPublicProjectsRow) (content.Project, error) {
	v := content.Project{Content: content.Content{ID: uuidString(r.ID), Kind: content.KindProject, Title: r.Title, Slug: r.Slug, Summary: r.Summary, BodyHTML: "", PublishedAt: timeValue(r.PublishedAt), PublishAt: timeValue(r.PublishAt), FeaturedMediaID: ptrUUID(r.HeroMediaID), Featured: r.Featured, Tags: r.Tags, Categories: r.Categories, CreatedAt: r.CreatedAt.Time, UpdatedAt: r.UpdatedAt.Time}, Outcome: r.Outcome, Role: r.Role, Technologies: r.Technologies, Stage: content.ProjectStage(r.ProjectStage), Availability: content.ProjectAvailability(r.Availability), SortOrder: int(r.SortOrder)}
	if len(r.Links) > 0 {
		if e := json.Unmarshal(r.Links, &v.Links); e != nil {
			return v, e
		}
	}
	return v, nil
}
func publicProjectDetail(r db.GetPublicProjectBySlugRow) (content.Project, error) {
	v := content.Project{Content: content.Content{ID: uuidString(r.ID), Kind: content.KindProject, Title: r.Title, Slug: r.Slug, Summary: r.Summary, BodyHTML: r.BodyHtml, PublishedAt: timeValue(r.PublishedAt), PublishAt: timeValue(r.PublishAt), FeaturedMediaID: ptrUUID(r.HeroMediaID), Featured: r.Featured, Tags: r.Tags, Categories: r.Categories, CreatedAt: r.CreatedAt.Time, UpdatedAt: r.UpdatedAt.Time}, Outcome: r.Outcome, Role: r.Role, Technologies: r.Technologies, Stage: content.ProjectStage(r.ProjectStage), Availability: content.ProjectAvailability(r.Availability)}
	if len(r.Links) > 0 {
		if e := json.Unmarshal(r.Links, &v.Links); e != nil {
			return v, e
		}
	}
	return v, nil
}
func publicPost(r db.ListPublicPostsRow) content.BlogPost {
	return content.BlogPost{Content: content.Content{ID: uuidString(r.ID), Kind: content.KindPost, Title: r.Title, Slug: r.Slug, Summary: r.Excerpt, PublishedAt: timeValue(r.PublishedAt), PublishAt: timeValue(r.PublishAt), FeaturedMediaID: ptrUUID(r.FeaturedMediaID), Featured: r.Featured, Tags: r.Tags, Categories: r.Categories, CreatedAt: r.CreatedAt.Time, UpdatedAt: r.UpdatedAt.Time}, ReadingTimeMinutes: int(r.ReadingTimeMinutes)}
}
func publicPostDetail(r db.GetPublicPostBySlugRow) content.BlogPost {
	return content.BlogPost{Content: content.Content{ID: uuidString(r.ID), Kind: content.KindPost, Title: r.Title, Slug: r.Slug, Summary: r.Excerpt, BodyHTML: r.BodyHtml, PublishedAt: timeValue(r.PublishedAt), PublishAt: timeValue(r.PublishAt), FeaturedMediaID: ptrUUID(r.FeaturedMediaID), Featured: r.Featured, Tags: r.Tags, Categories: r.Categories, CreatedAt: r.CreatedAt.Time, UpdatedAt: r.UpdatedAt.Time}, ReadingTimeMinutes: int(r.ReadingTimeMinutes)}
}
func ptrUUID(u pgtype.UUID) *string {
	if !u.Valid {
		return nil
	}
	s := uuidString(u)
	return &s
}
func publicProfile(r db.GetPublicProfileRow) content.Profile {
	return content.Profile{ID: "profile", Name: r.DisplayName, Headline: r.Headline, Education: r.Education, CurrentRole: r.CurrentPosition, Statement: r.Statement, BioHTML: r.BioHtml, ResumeMediaID: ptrUUID(r.ResumeMediaID), UpdatedAt: r.UpdatedAt.Time}
}

func (a *Adapters) ListAdminProjects(ctx context.Context, p httpapi.Page) ([]content.Project, int64, error) {
	rs, e := a.Queries.ListAdminProjects(ctx, db.ListAdminProjectsParams{Limit: int32(p.Limit), Offset: int32(p.Offset)})
	if e != nil {
		return nil, 0, mapDBError(e)
	}
	n, e := a.Queries.CountAdminProjects(ctx)
	if e != nil {
		return nil, 0, mapDBError(e)
	}
	out := make([]content.Project, 0, len(rs))
	for _, r := range rs {
		v, e := a.adminProject(ctx, a.Queries, r)
		if e != nil {
			return nil, 0, e
		}
		out = append(out, v)
	}
	return out, n, nil
}
func (a *Adapters) GetAdminProject(ctx context.Context, id string) (content.Project, error) {
	u, e := uuidValue(id)
	if e != nil {
		return content.Project{}, httpapi.ErrNotFound
	}
	r, e := a.Queries.GetAdminProject(ctx, u)
	if e != nil {
		return content.Project{}, mapDBError(e)
	}
	return a.adminProject(ctx, a.Queries, r)
}
func (a *Adapters) adminProject(ctx context.Context, q *db.Queries, r db.Project) (content.Project, error) {
	v := content.Project{Content: content.Content{ID: uuidString(r.ID), Kind: content.KindProject, Title: r.Title, Slug: r.Slug, Summary: r.Summary, BodyMarkdown: r.BodyMarkdown, BodyHTML: r.BodyHtml, Status: content.Status(r.ContentStatus), PublishAt: timeValue(r.PublishAt), PublishedAt: timeValue(r.PublishedAt), ArchivedAt: timeValue(r.ArchivedAt), FeaturedMediaID: ptrUUID(r.HeroMediaID), Featured: r.Featured, CreatedAt: r.CreatedAt.Time, UpdatedAt: r.UpdatedAt.Time}, Outcome: r.Outcome, Role: r.Role, Technologies: r.Technologies, Stage: content.ProjectStage(r.ProjectStage), Availability: content.ProjectAvailability(r.Availability), SortOrder: int(r.SortOrder)}
	tags, e := q.ListProjectTags(ctx, r.ID)
	if e != nil {
		return v, mapDBError(e)
	}
	cats, e := q.ListProjectCategories(ctx, r.ID)
	if e != nil {
		return v, mapDBError(e)
	}
	links, e := q.ListProjectLinks(ctx, r.ID)
	if e != nil {
		return v, mapDBError(e)
	}
	for _, t := range tags {
		v.TagIDs = append(v.TagIDs, uuidString(t.ID))
		v.Tags = append(v.Tags, t.Slug)
	}
	for _, t := range cats {
		v.CategoryIDs = append(v.CategoryIDs, uuidString(t.ID))
		v.Categories = append(v.Categories, t.Slug)
	}
	for _, l := range links {
		v.Links = append(v.Links, content.ProjectLink{Kind: string(l.LinkKind), Label: l.Label, URL: l.Url, SortOrder: int(l.SortOrder)})
	}
	return v, nil
}

func (a *Adapters) ListAdminPosts(ctx context.Context, p httpapi.Page) ([]content.BlogPost, int64, error) {
	rs, e := a.Queries.ListAdminPosts(ctx, db.ListAdminPostsParams{Limit: int32(p.Limit), Offset: int32(p.Offset)})
	if e != nil {
		return nil, 0, mapDBError(e)
	}
	n, e := a.Queries.CountAdminPosts(ctx)
	if e != nil {
		return nil, 0, mapDBError(e)
	}
	out := make([]content.BlogPost, 0, len(rs))
	for _, r := range rs {
		v, e := a.adminPost(ctx, a.Queries, r)
		if e != nil {
			return nil, 0, e
		}
		out = append(out, v)
	}
	return out, n, nil
}
func (a *Adapters) GetAdminPost(ctx context.Context, id string) (content.BlogPost, error) {
	u, e := uuidValue(id)
	if e != nil {
		return content.BlogPost{}, httpapi.ErrNotFound
	}
	r, e := a.Queries.GetAdminPost(ctx, u)
	if e != nil {
		return content.BlogPost{}, mapDBError(e)
	}
	return a.adminPost(ctx, a.Queries, r)
}
func (a *Adapters) adminPost(ctx context.Context, q *db.Queries, r db.BlogPost) (content.BlogPost, error) {
	v := content.BlogPost{Content: content.Content{ID: uuidString(r.ID), Kind: content.KindPost, Title: r.Title, Slug: r.Slug, Summary: r.Excerpt, BodyMarkdown: r.BodyMarkdown, BodyHTML: r.BodyHtml, Status: content.Status(r.ContentStatus), PublishAt: timeValue(r.PublishAt), PublishedAt: timeValue(r.PublishedAt), ArchivedAt: timeValue(r.ArchivedAt), FeaturedMediaID: ptrUUID(r.FeaturedMediaID), Featured: r.Featured, CreatedAt: r.CreatedAt.Time, UpdatedAt: r.UpdatedAt.Time}, ReadingTimeMinutes: int(r.ReadingTimeMinutes)}
	tags, e := q.ListPostTags(ctx, r.ID)
	if e != nil {
		return v, mapDBError(e)
	}
	cats, e := q.ListPostCategories(ctx, r.ID)
	if e != nil {
		return v, mapDBError(e)
	}
	for _, t := range tags {
		v.TagIDs = append(v.TagIDs, uuidString(t.ID))
		v.Tags = append(v.Tags, t.Slug)
	}
	for _, t := range cats {
		v.CategoryIDs = append(v.CategoryIDs, uuidString(t.ID))
		v.Categories = append(v.Categories, t.Slug)
	}
	return v, nil
}

func (a *Adapters) render(ctx context.Context, md string) (string, error) {
	if a.Renderer == nil {
		return md, nil
	}
	return a.Renderer.Render(ctx, md)
}
func (a *Adapters) CreateProject(ctx context.Context, by string, in content.ProjectInput, status content.Status) (content.Project, error) {
	if e := in.Validate(); e != nil {
		return content.Project{}, httpapi.ErrConflict
	}
	u, e := uuidValue(by)
	if e != nil {
		return content.Project{}, httpapi.ErrNotFound
	}
	slug := in.Slug
	if slug == "" {
		slug = content.GenerateSlug(in.Title)
	}
	if e := content.ValidateSlug(slug); e != nil {
		return content.Project{}, httpapi.ErrConflict
	}
	in.Slug = slug
	mediaID, e := optionalUUID(in.FeaturedMediaID)
	if e != nil {
		return content.Project{}, e
	}
	body, e := a.render(ctx, in.BodyMarkdown)
	if e != nil {
		return content.Project{}, e
	}
	pa, e := statusTimes(status, in.PublishAt, time.Now())
	if e != nil {
		return content.Project{}, httpapi.ErrConflict
	}
	tx, e := a.Pool.Begin(ctx)
	if e != nil {
		return content.Project{}, e
	}
	defer tx.Rollback(ctx)
	q := a.Queries.WithTx(tx)
	createStatus := status
	if status == content.StatusPublished || status == content.StatusArchived {
		createStatus = content.StatusDraft
	}
	createPublish := pa
	if createStatus == content.StatusDraft {
		createPublish = nil
	}
	stage := in.Stage
	if stage == "" {
		stage = content.ProjectCurrent
	}
	availability := in.Availability
	if availability == "" {
		availability = content.AvailabilityPublic
	}
	r, e := q.CreateProject(ctx, db.CreateProjectParams{CreatedBy: u, Title: in.Title, Slug: slug, Summary: in.Summary, BodyMarkdown: in.BodyMarkdown, BodyHtml: body, Role: in.Role, Technologies: nonNilStrings(in.Technologies), Outcome: in.Outcome, ContentStatus: statusValue(createStatus), ProjectStage: db.ProjectStage(stage), Availability: db.ProjectAvailability(availability), PublishAt: ts(createPublish), Featured: in.Featured, SortOrder: int32(in.SortOrder), HeroMediaID: mediaID})
	if e != nil {
		return content.Project{}, mapDBError(e)
	}
	if e = replaceProject(ctx, q, r.ID, in.TagIDs, in.CategoryIDs, in.Links); e != nil {
		return content.Project{}, e
	}
	if status == content.StatusPublished || status == content.StatusArchived {
		in.Stage = stage
		in.Availability = availability
		r, e = updateProjectRow(ctx, q, r, u, in, status, body, pa, mediaID)
		if e != nil {
			return content.Project{}, e
		}
	}
	if e = tx.Commit(ctx); e != nil {
		return content.Project{}, mapDBError(e)
	}
	return a.adminProject(ctx, a.Queries, r)
}
func (a *Adapters) UpdateProject(ctx context.Context, id, by string, in content.ProjectInput, status content.Status) (content.Project, error) {
	if e := in.Validate(); e != nil {
		return content.Project{}, httpapi.ErrConflict
	}
	u, e := uuidValue(id)
	if e != nil {
		return content.Project{}, httpapi.ErrNotFound
	}
	actor, e := uuidValue(by)
	if e != nil {
		return content.Project{}, httpapi.ErrNotFound
	}
	old, e := a.Queries.GetAdminProject(ctx, u)
	if e != nil {
		return content.Project{}, mapDBError(e)
	}
	if in.Stage == "" {
		in.Stage = content.ProjectStage(old.ProjectStage)
	}
	if in.Availability == "" {
		in.Availability = content.ProjectAvailability(old.Availability)
	}
	slug := in.Slug
	if slug == "" {
		slug = old.Slug
	}
	existingContent := content.Content{
		Status: content.Status(old.ContentStatus), PublishAt: timeValue(old.PublishAt),
		PublishedAt: timeValue(old.PublishedAt), ArchivedAt: timeValue(old.ArchivedAt),
	}
	if e := content.ValidateSlugChange(old.Slug, slug, existingContent, time.Now()); e != nil {
		return content.Project{}, httpapi.ErrConflict
	}
	in.Slug = slug
	mediaID, e := optionalUUID(in.FeaturedMediaID)
	if e != nil {
		return content.Project{}, e
	}
	body, e := a.render(ctx, in.BodyMarkdown)
	if e != nil {
		return content.Project{}, e
	}
	pa, e := transitionPublishAt(
		content.Status(old.ContentStatus), timeValue(old.PublishAt), timeValue(old.PublishedAt),
		timeValue(old.ArchivedAt), status, in.PublishAt, time.Now(),
	)
	if e != nil {
		return content.Project{}, httpapi.ErrConflict
	}
	tx, e := a.Pool.Begin(ctx)
	if e != nil {
		return content.Project{}, e
	}
	defer tx.Rollback(ctx)
	q := a.Queries.WithTx(tx)
	r, e := updateProjectRow(ctx, q, old, actor, in, status, body, pa, mediaID)
	if e != nil {
		if errors.Is(e, pgx.ErrNoRows) {
			return content.Project{}, httpapi.ErrConflict
		}
		return content.Project{}, mapDBError(e)
	}
	r.Slug = slug
	if e = replaceProject(ctx, q, r.ID, in.TagIDs, in.CategoryIDs, in.Links); e != nil {
		return content.Project{}, e
	}
	if e = tx.Commit(ctx); e != nil {
		return content.Project{}, mapDBError(e)
	}
	return a.adminProject(ctx, a.Queries, r)
}
func updateProjectRow(ctx context.Context, q *db.Queries, old db.Project, actor pgtype.UUID, in content.ProjectInput, status content.Status, body string, pa *time.Time, mediaID pgtype.UUID) (db.Project, error) {
	return q.UpdateProject(ctx, db.UpdateProjectParams{ID: old.ID, UpdatedBy: actor, Title: in.Title, Slug: in.Slug, Summary: in.Summary, BodyMarkdown: in.BodyMarkdown, BodyHtml: body, Role: in.Role, Technologies: nonNilStrings(in.Technologies), Outcome: in.Outcome, ContentStatus: statusValue(status), ProjectStage: db.ProjectStage(in.Stage), Availability: db.ProjectAvailability(in.Availability), PublishAt: ts(pa), Featured: in.Featured, SortOrder: int32(in.SortOrder), HeroMediaID: mediaID, UpdatedAt: expectedAt(old.UpdatedAt, in.ExpectedUpdatedAt)})
}
func replaceProject(ctx context.Context, q *db.Queries, id pgtype.UUID, tags, cats []string, links []content.ProjectLink) error {
	tu, e := uuidList(tags)
	if e != nil {
		return httpapi.ErrConflict
	}
	cu, e := uuidList(cats)
	if e != nil {
		return httpapi.ErrConflict
	}
	if e = q.DeleteProjectTags(ctx, id); e != nil {
		return mapDBError(e)
	}
	if e = q.AddProjectTags(ctx, db.AddProjectTagsParams{ProjectID: id, Column2: tu}); e != nil {
		return mapDBError(e)
	}
	if e = q.DeleteProjectCategories(ctx, id); e != nil {
		return mapDBError(e)
	}
	if e = q.AddProjectCategories(ctx, db.AddProjectCategoriesParams{ProjectID: id, Column2: cu}); e != nil {
		return mapDBError(e)
	}
	oldLinks, e := q.ListProjectLinks(ctx, id)
	if e != nil {
		return mapDBError(e)
	}
	for _, old := range oldLinks {
		if e = q.DeleteProjectLink(ctx, db.DeleteProjectLinkParams{ID: old.ID, UpdatedAt: old.UpdatedAt}); e != nil {
			return mapDBError(e)
		}
	}
	for _, l := range links {
		if _, e = q.CreateProjectLink(ctx, db.CreateProjectLinkParams{ProjectID: id, Label: l.Label, Url: l.URL, LinkKind: db.ProjectLinkKind(l.Kind), SortOrder: int32(l.SortOrder)}); e != nil {
			return mapDBError(e)
		}
	}
	return nil
}

func (a *Adapters) CreatePost(ctx context.Context, by string, in content.PostInput, status content.Status) (content.BlogPost, error) {
	if e := in.Validate(); e != nil {
		return content.BlogPost{}, httpapi.ErrConflict
	}
	u, e := uuidValue(by)
	if e != nil {
		return content.BlogPost{}, httpapi.ErrNotFound
	}
	slug := in.Slug
	if slug == "" {
		slug = content.GenerateSlug(in.Title)
	}
	if e := content.ValidateSlug(slug); e != nil {
		return content.BlogPost{}, httpapi.ErrConflict
	}
	in.Slug = slug
	mediaID, e := optionalUUID(in.FeaturedMediaID)
	if e != nil {
		return content.BlogPost{}, e
	}
	tagIDs, e := uuidList(in.TagIDs)
	if e != nil {
		return content.BlogPost{}, httpapi.ErrConflict
	}
	categoryIDs, e := uuidList(in.CategoryIDs)
	if e != nil {
		return content.BlogPost{}, httpapi.ErrConflict
	}
	body, e := a.render(ctx, in.BodyMarkdown)
	if e != nil {
		return content.BlogPost{}, e
	}
	pa, e := statusTimes(status, in.PublishAt, time.Now())
	if e != nil {
		return content.BlogPost{}, httpapi.ErrConflict
	}
	tx, e := a.Pool.Begin(ctx)
	if e != nil {
		return content.BlogPost{}, e
	}
	defer tx.Rollback(ctx)
	q := a.Queries.WithTx(tx)
	createStatus := status
	if status == content.StatusPublished || status == content.StatusArchived {
		createStatus = content.StatusDraft
	}
	createPublish := pa
	if createStatus == content.StatusDraft {
		createPublish = nil
	}
	r, e := q.CreatePost(ctx, db.CreatePostParams{CreatedBy: u, Title: in.Title, Slug: slug, Excerpt: in.Summary, BodyMarkdown: in.BodyMarkdown, BodyHtml: body, ContentStatus: statusValue(createStatus), PublishAt: ts(createPublish), ReadingTimeMinutes: int32(in.EffectiveReadingTime()), Featured: in.Featured, FeaturedMediaID: mediaID})
	if e != nil {
		return content.BlogPost{}, mapDBError(e)
	}
	if e = q.DeletePostTags(ctx, r.ID); e != nil {
		return content.BlogPost{}, mapDBError(e)
	}
	if e = q.AddPostTags(ctx, db.AddPostTagsParams{PostID: r.ID, Column2: tagIDs}); e != nil {
		return content.BlogPost{}, mapDBError(e)
	}
	if e = q.DeletePostCategories(ctx, r.ID); e != nil {
		return content.BlogPost{}, mapDBError(e)
	}
	if e = q.AddPostCategories(ctx, db.AddPostCategoriesParams{PostID: r.ID, Column2: categoryIDs}); e != nil {
		return content.BlogPost{}, mapDBError(e)
	}
	if status == content.StatusPublished || status == content.StatusArchived {
		r, e = updatePostRow(ctx, q, r, u, in, status, body, pa, mediaID)
		if e != nil {
			return content.BlogPost{}, mapDBError(e)
		}
	}
	if e = tx.Commit(ctx); e != nil {
		return content.BlogPost{}, mapDBError(e)
	}
	return a.adminPost(ctx, a.Queries, r)
}
func (a *Adapters) UpdatePost(ctx context.Context, id, by string, in content.PostInput, status content.Status) (content.BlogPost, error) {
	if e := in.Validate(); e != nil {
		return content.BlogPost{}, httpapi.ErrConflict
	}
	u, e := uuidValue(id)
	if e != nil {
		return content.BlogPost{}, httpapi.ErrNotFound
	}
	actor, e := uuidValue(by)
	if e != nil {
		return content.BlogPost{}, httpapi.ErrNotFound
	}
	old, e := a.Queries.GetAdminPost(ctx, u)
	if e != nil {
		return content.BlogPost{}, mapDBError(e)
	}
	if in.Slug == "" {
		in.Slug = old.Slug
	}
	existingContent := content.Content{
		Status: content.Status(old.ContentStatus), PublishAt: timeValue(old.PublishAt),
		PublishedAt: timeValue(old.PublishedAt), ArchivedAt: timeValue(old.ArchivedAt),
	}
	if e := content.ValidateSlugChange(old.Slug, in.Slug, existingContent, time.Now()); e != nil {
		return content.BlogPost{}, httpapi.ErrConflict
	}
	mediaID, e := optionalUUID(in.FeaturedMediaID)
	if e != nil {
		return content.BlogPost{}, e
	}
	body, e := a.render(ctx, in.BodyMarkdown)
	if e != nil {
		return content.BlogPost{}, e
	}
	pa, e := transitionPublishAt(
		content.Status(old.ContentStatus), timeValue(old.PublishAt), timeValue(old.PublishedAt),
		timeValue(old.ArchivedAt), status, in.PublishAt, time.Now(),
	)
	if e != nil {
		return content.BlogPost{}, httpapi.ErrConflict
	}
	tx, e := a.Pool.Begin(ctx)
	if e != nil {
		return content.BlogPost{}, e
	}
	defer tx.Rollback(ctx)
	q := a.Queries.WithTx(tx)
	r, e := updatePostRow(ctx, q, old, actor, in, status, body, pa, mediaID)
	if e != nil {
		if errors.Is(e, pgx.ErrNoRows) {
			return content.BlogPost{}, httpapi.ErrConflict
		}
		return content.BlogPost{}, mapDBError(e)
	}
	tu, e := uuidList(in.TagIDs)
	if e != nil {
		return content.BlogPost{}, httpapi.ErrConflict
	}
	cu, e := uuidList(in.CategoryIDs)
	if e != nil {
		return content.BlogPost{}, httpapi.ErrConflict
	}
	if e = q.DeletePostTags(ctx, r.ID); e != nil {
		return content.BlogPost{}, mapDBError(e)
	}
	if e = q.AddPostTags(ctx, db.AddPostTagsParams{PostID: r.ID, Column2: tu}); e != nil {
		return content.BlogPost{}, mapDBError(e)
	}
	if e = q.DeletePostCategories(ctx, r.ID); e != nil {
		return content.BlogPost{}, mapDBError(e)
	}
	if e = q.AddPostCategories(ctx, db.AddPostCategoriesParams{PostID: r.ID, Column2: cu}); e != nil {
		return content.BlogPost{}, mapDBError(e)
	}
	if e = tx.Commit(ctx); e != nil {
		return content.BlogPost{}, mapDBError(e)
	}
	return a.adminPost(ctx, a.Queries, r)
}
func updatePostRow(ctx context.Context, q *db.Queries, old db.BlogPost, actor pgtype.UUID, in content.PostInput, status content.Status, body string, pa *time.Time, mediaID pgtype.UUID) (db.BlogPost, error) {
	return q.UpdatePost(ctx, db.UpdatePostParams{ID: old.ID, UpdatedBy: actor, Title: in.Title, Slug: in.Slug, Excerpt: in.Summary, BodyMarkdown: in.BodyMarkdown, BodyHtml: body, ContentStatus: statusValue(status), PublishAt: ts(pa), ReadingTimeMinutes: int32(in.EffectiveReadingTime()), Featured: in.Featured, FeaturedMediaID: mediaID, UpdatedAt: expectedAt(old.UpdatedAt, in.ExpectedUpdatedAt)})
}

func (a *Adapters) DeleteProject(ctx context.Context, id, by string) error {
	u, e := uuidValue(id)
	if e != nil {
		return httpapi.ErrNotFound
	}
	affected, e := a.Queries.DeleteProject(ctx, u)
	if e != nil {
		return mapDBError(e)
	}
	if affected == 0 {
		return httpapi.ErrNotFound
	}
	return nil
}
func (a *Adapters) DeletePost(ctx context.Context, id, by string) error {
	u, e := uuidValue(id)
	if e != nil {
		return httpapi.ErrNotFound
	}
	affected, e := a.Queries.DeletePost(ctx, u)
	if e != nil {
		return mapDBError(e)
	}
	if affected == 0 {
		return httpapi.ErrNotFound
	}
	return nil
}
func (a *Adapters) UpdateProfile(ctx context.Context, by string, in content.ProfileInput) (content.Profile, error) {
	if e := in.Validate(); e != nil {
		return content.Profile{}, httpapi.ErrConflict
	}
	actor, e := uuidValue(by)
	if e != nil {
		return content.Profile{}, httpapi.ErrNotFound
	}
	mediaID, e := optionalUUID(in.ResumeMediaID)
	if e != nil {
		return content.Profile{}, e
	}
	var expected pgtype.Timestamptz
	_, e = a.Queries.GetAdminProfile(ctx)
	switch {
	case e == nil:
		if in.ExpectedUpdatedAt == nil {
			return content.Profile{}, httpapi.ErrConflict
		}
		expected = ts(in.ExpectedUpdatedAt)
	case errors.Is(e, pgx.ErrNoRows):
		if in.ExpectedUpdatedAt != nil {
			return content.Profile{}, httpapi.ErrConflict
		}
	default:
		return content.Profile{}, mapDBError(e)
	}
	body, e := a.render(ctx, in.BioMarkdown)
	if e != nil {
		return content.Profile{}, e
	}
	v, e := a.Queries.UpsertProfile(ctx, db.UpsertProfileParams{DisplayName: in.Name, Headline: in.Headline, Education: in.Education, CurrentPosition: in.CurrentRole, Statement: in.Statement, BioMarkdown: in.BioMarkdown, BioHtml: body, ResumeMediaID: mediaID, UpdatedBy: actor, UpdatedAt: expected})
	if e != nil {
		if errors.Is(e, pgx.ErrNoRows) {
			return content.Profile{}, httpapi.ErrConflict
		}
		return content.Profile{}, mapDBError(e)
	}
	return adminProfile(v), nil
}
func (a *Adapters) GetAdminProfile(ctx context.Context) (content.Profile, error) {
	r, e := a.Queries.GetAdminProfile(ctx)
	if e != nil {
		return content.Profile{}, mapDBError(e)
	}
	return adminProfile(r), nil
}
func adminProfile(r db.Profile) content.Profile {
	return content.Profile{ID: "profile", Name: r.DisplayName, Headline: r.Headline, Education: r.Education, CurrentRole: r.CurrentPosition, Statement: r.Statement, BioMarkdown: r.BioMarkdown, BioHTML: r.BioHtml, ResumeMediaID: ptrUUID(r.ResumeMediaID), UpdatedAt: r.UpdatedAt.Time}
}
func (a *Adapters) ListContactLinksAdmin(ctx context.Context) ([]content.ContactLink, error) {
	rs, e := a.Queries.ListAdminContactLinks(ctx, db.ListAdminContactLinksParams{Limit: 100, Offset: 0})
	if e != nil {
		return nil, mapDBError(e)
	}
	out := make([]content.ContactLink, 0, len(rs))
	for _, r := range rs {
		out = append(out, content.ContactLink{ID: uuidString(r.ID), Label: r.Label, Kind: content.ContactLinkKind(r.Kind), URL: r.Url, IconKey: stringPtr(r.IconKey), SortOrder: int(r.SortOrder), IsVisible: r.IsVisible, UpdatedAt: r.UpdatedAt.Time})
	}
	return out, nil
}
func (a *Adapters) CreateContactLink(ctx context.Context, by string, in content.ContactLinkInput) (content.ContactLink, error) {
	if e := in.Validate(); e != nil {
		return content.ContactLink{}, httpapi.ErrConflict
	}
	r, e := a.Queries.CreateContactLink(ctx, db.CreateContactLinkParams{Label: in.Label, Kind: db.ContactLinkKind(in.Kind), Url: in.URL, IconKey: nullableString(in.IconKey), SortOrder: int32(in.SortOrder), IsVisible: in.IsVisible})
	if e != nil {
		return content.ContactLink{}, mapDBError(e)
	}
	return contactLink(r), nil
}
func (a *Adapters) UpdateContactLink(ctx context.Context, id, by string, in content.ContactLinkInput) (content.ContactLink, error) {
	if e := in.Validate(); e != nil || in.ExpectedUpdatedAt == nil {
		return content.ContactLink{}, httpapi.ErrConflict
	}
	u, e := uuidValue(id)
	if e != nil {
		return content.ContactLink{}, httpapi.ErrNotFound
	}
	_, e = a.Queries.GetAdminContactLink(ctx, u)
	if e != nil {
		return content.ContactLink{}, mapDBError(e)
	}
	r, e := a.Queries.UpdateContactLink(ctx, db.UpdateContactLinkParams{ID: u, Label: in.Label, Kind: db.ContactLinkKind(in.Kind), Url: in.URL, IconKey: nullableString(in.IconKey), SortOrder: int32(in.SortOrder), IsVisible: in.IsVisible, UpdatedAt: ts(in.ExpectedUpdatedAt)})
	if e != nil {
		if errors.Is(e, pgx.ErrNoRows) {
			return content.ContactLink{}, httpapi.ErrConflict
		}
		return content.ContactLink{}, mapDBError(e)
	}
	return contactLink(r), nil
}
func contactLink(r db.ContactLink) content.ContactLink {
	return content.ContactLink{ID: uuidString(r.ID), Label: r.Label, Kind: content.ContactLinkKind(r.Kind), URL: r.Url, IconKey: stringPtr(r.IconKey), SortOrder: int(r.SortOrder), IsVisible: r.IsVisible, UpdatedAt: r.UpdatedAt.Time}
}
func (a *Adapters) DeleteContactLink(ctx context.Context, id, by string) error {
	u, e := uuidValue(id)
	if e != nil {
		return httpapi.ErrNotFound
	}
	affected, e := a.Queries.DeleteContactLink(ctx, u)
	if e != nil {
		return mapDBError(e)
	}
	if affected == 0 {
		return httpapi.ErrNotFound
	}
	return nil
}
func taxonomyKind(s string) (db.TaxonomyKind, error) {
	k := db.TaxonomyKind(s)
	if k != db.TaxonomyKindTag && k != db.TaxonomyKindCategory {
		return "", httpapi.ErrConflict
	}
	return k, nil
}
func (a *Adapters) ListTaxonomy(ctx context.Context, kind string) ([]httpapi.TaxonomyTerm, error) {
	k, e := taxonomyKind(kind)
	if e != nil {
		return nil, e
	}
	rs, e := a.Queries.ListTaxonomyTerms(ctx, db.ListTaxonomyTermsParams{Kind: k, Limit: 100, Offset: 0})
	if e != nil {
		return nil, mapDBError(e)
	}
	out := make([]httpapi.TaxonomyTerm, 0, len(rs))
	for _, r := range rs {
		out = append(out, taxonomy(r))
	}
	return out, nil
}
func taxonomy(r db.TaxonomyTerm) httpapi.TaxonomyTerm {
	return httpapi.TaxonomyTerm{ID: uuidString(r.ID), Kind: string(r.Kind), Name: r.Name, Slug: r.Slug, Description: stringPtr(r.Description), CreatedAt: r.CreatedAt.Time, UpdatedAt: r.UpdatedAt.Time}
}
func (a *Adapters) CreateTaxonomy(ctx context.Context, by string, in httpapi.TaxonomyInput) (httpapi.TaxonomyTerm, error) {
	return a.taxCreate(ctx, in.Kind, in)
}
func (a *Adapters) taxCreate(ctx context.Context, kind string, in httpapi.TaxonomyInput) (httpapi.TaxonomyTerm, error) {
	k, e := taxonomyKind(kind)
	if e != nil {
		return httpapi.TaxonomyTerm{}, e
	}
	if in.Name == "" || content.ValidateSlug(in.Slug) != nil {
		return httpapi.TaxonomyTerm{}, httpapi.ErrConflict
	}
	r, e := a.Queries.CreateTaxonomyTerm(ctx, db.CreateTaxonomyTermParams{Kind: k, Name: in.Name, Slug: in.Slug, Description: &in.Description})
	if e != nil {
		return httpapi.TaxonomyTerm{}, mapDBError(e)
	}
	return taxonomy(r), nil
}
func (a *Adapters) UpdateTaxonomy(ctx context.Context, id, by string, in httpapi.TaxonomyInput) (httpapi.TaxonomyTerm, error) {
	if in.ExpectedUpdatedAt == nil || in.Name == "" || content.ValidateSlug(in.Slug) != nil {
		return httpapi.TaxonomyTerm{}, httpapi.ErrConflict
	}
	u, e := uuidValue(id)
	if e != nil {
		return httpapi.TaxonomyTerm{}, httpapi.ErrNotFound
	}
	old, e := a.Queries.GetTaxonomyTerm(ctx, u)
	if e != nil {
		return httpapi.TaxonomyTerm{}, mapDBError(e)
	}
	if k, e := taxonomyKind(in.Kind); e != nil || k != old.Kind {
		return httpapi.TaxonomyTerm{}, httpapi.ErrConflict
	}
	r, e := a.Queries.UpdateTaxonomyTerm(ctx, db.UpdateTaxonomyTermParams{ID: u, Name: in.Name, Slug: in.Slug, Description: &in.Description, UpdatedAt: expectedAt(old.UpdatedAt, in.ExpectedUpdatedAt)})
	if e != nil {
		if errors.Is(e, pgx.ErrNoRows) {
			return httpapi.TaxonomyTerm{}, httpapi.ErrConflict
		}
		return httpapi.TaxonomyTerm{}, mapDBError(e)
	}
	return taxonomy(r), nil
}
func (a *Adapters) DeleteTaxonomy(ctx context.Context, id, by string) error {
	u, e := uuidValue(id)
	if e != nil {
		return httpapi.ErrNotFound
	}
	affected, e := a.Queries.DeleteTaxonomyTerm(ctx, u)
	if e != nil {
		return mapDBError(e)
	}
	if affected == 0 {
		return httpapi.ErrNotFound
	}
	return nil
}

func (a *Adapters) FindUser(ctx context.Context, username string) (httpapi.AuthUser, error) {
	r, e := a.Queries.GetUserByEmail(ctx, username)
	if e != nil {
		return httpapi.AuthUser{}, mapDBError(e)
	}
	return httpapi.AuthUser{ID: uuidString(r.ID), Username: r.Email, PasswordHash: r.PasswordHash, Active: r.Status == db.UserStatusActive}, nil
}
func (a *Adapters) CreateSession(ctx context.Context, s auth.Session) error {
	u, e := uuidValue(s.AdminID)
	if e != nil {
		return httpapi.ErrNotFound
	}
	idleExpiresAt := s.IdleExpiresAt
	if idleExpiresAt.IsZero() || idleExpiresAt.After(s.ExpiresAt) {
		idleExpiresAt = s.ExpiresAt
	}
	_, e = a.Queries.CreateSession(ctx, db.CreateSessionParams{UserID: u, TokenIDHash: s.TokenHash[:], CsrfTokenHash: s.CSRFTokenHash[:], ExpiresAt: ts(&s.ExpiresAt), IdleExpiresAt: ts(&idleExpiresAt)})
	return mapDBError(e)
}
func (a *Adapters) FindByTokenHash(ctx context.Context, h [32]byte) (auth.Session, error) {
	r, e := a.Queries.GetActiveSessionByTokenHash(ctx, h[:])
	if e != nil {
		return auth.Session{}, mapDBError(e)
	}
	return session(r), nil
}
func session(r db.Session) auth.Session {
	return auth.Session{ID: uuidString(r.ID), AdminID: uuidString(r.UserID), TokenHash: bytes32(r.TokenIDHash), CSRFTokenHash: bytes32(r.CsrfTokenHash), CreatedAt: r.CreatedAt.Time, LastSeenAt: r.LastSeenAt.Time, ExpiresAt: r.ExpiresAt.Time, IdleExpiresAt: r.IdleExpiresAt.Time, RevokedAt: timeValue(r.RevokedAt)}
}
func bytes32(b []byte) [32]byte { var out [32]byte; copy(out[:], b); return out }
func (a *Adapters) Touch(ctx context.Context, id string, at, idleExpiresAt time.Time) error {
	u, e := uuidValue(id)
	if e != nil {
		return httpapi.ErrNotFound
	}
	if idleExpiresAt.Before(at) {
		return httpapi.ErrConflict
	}
	if e = a.Queries.TouchSession(ctx, db.TouchSessionParams{ID: u, IdleExpiresAt: ts(&idleExpiresAt)}); e != nil {
		return mapDBError(e)
	}
	return nil
}
func (a *Adapters) Revoke(ctx context.Context, id string, at time.Time) error {
	u, e := uuidValue(id)
	if e != nil {
		return httpapi.ErrNotFound
	}
	if e = a.Queries.RevokeSession(ctx, u); e != nil {
		return mapDBError(e)
	}
	return nil
}
