// Package content contains the content domain model and its business rules.
// It deliberately has no dependency on persistence or transport types.
package content

import "time"

type ContentKind string

const (
	KindProject ContentKind = "project"
	KindPost    ContentKind = "post"
)

type Status string

const (
	StatusDraft     Status = "draft"
	StatusScheduled Status = "scheduled"
	StatusPublished Status = "published"
	StatusArchived  Status = "archived"
)

type ProjectStage string

const (
	ProjectCurrent   ProjectStage = "current"
	ProjectCompleted ProjectStage = "completed"
	ProjectArchived  ProjectStage = "archived"
)

type ProjectAvailability string

const (
	AvailabilityPublic  ProjectAvailability = "public"
	AvailabilityPrivate ProjectAvailability = "private"
)

// Content is the shared portion of a project or blog post.
type Content struct {
	ID              string
	Kind            ContentKind
	Title           string
	Slug            string
	Summary         string
	BodyMarkdown    string
	BodyHTML        string
	Status          Status
	PublishAt       *time.Time
	PublishedAt     *time.Time
	ArchivedAt      *time.Time
	FeaturedMediaID *string
	Featured        bool
	Tags            []string
	Categories      []string
	TagIDs          []string
	CategoryIDs     []string
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

type Project struct {
	Content
	Outcome      string
	Role         string
	Technologies []string
	Stage        ProjectStage
	Availability ProjectAvailability
	Links        []ProjectLink
	SortOrder    int
}

// PublicContent includes both editorial publication and the project's
// visibility policy. An internally published private project remains private.
func (p Project) PublicContent(now time.Time) bool {
	// The frontend treats availability as optional; an omitted value keeps the
	// historical/public default. Only an explicit private value hides a project.
	return p.Availability != AvailabilityPrivate && p.Content.PublicContent(now)
}

type ProjectLink struct {
	Kind      string `json:"kind"`
	Label     string `json:"label"`
	URL       string `json:"url"`
	SortOrder int    `json:"sort_order"`
}

type BlogPost struct {
	Content
	ReadingTimeMinutes int
}

type Profile struct {
	ID            string
	Name          string
	Headline      string
	Education     string
	CurrentRole   string
	Statement     string
	BioMarkdown   string
	BioHTML       string
	ResumeMediaID *string
	UpdatedAt     time.Time
}

type ContactLink struct {
	ID        string
	Label     string
	Kind      ContactLinkKind
	URL       string
	IconKey   string
	SortOrder int
	IsVisible bool
	UpdatedAt time.Time
}

type ContactLinkKind string

const (
	ContactExternal ContactLinkKind = "external"
	ContactEmail    ContactLinkKind = "email"
)

type Media struct {
	ID           string
	OriginalName string
	StorageKey   string
	PublicURL    string
	MIMEType     string
	SizeBytes    int64
	Width        int
	Height       int
	AltText      string
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

type ContentInput struct {
	Title             string     `json:"title"`
	Slug              string     `json:"slug"`
	Summary           string     `json:"summary"`
	BodyMarkdown      string     `json:"body_markdown"`
	PublishAt         *time.Time `json:"publish_at"`
	FeaturedMediaID   *string    `json:"featured_media_id"`
	Featured          bool       `json:"featured"`
	TagIDs            []string   `json:"tag_ids"`
	CategoryIDs       []string   `json:"category_ids"`
	ExpectedUpdatedAt *time.Time `json:"expected_updated_at"`
}

type ProjectInput struct {
	ContentInput
	Outcome      string              `json:"outcome"`
	Role         string              `json:"role"`
	Technologies []string            `json:"technologies"`
	Stage        ProjectStage        `json:"stage"`
	Availability ProjectAvailability `json:"availability"`
	Links        []ProjectLink       `json:"links"`
	SortOrder    int                 `json:"sort_order"`
}

type PostInput struct {
	ContentInput
	// A zero value means derive it from BodyMarkdown. The server remains authoritative.
	ReadingTimeMinutes int `json:"reading_time_minutes"`
}

type ProfileInput struct {
	Name              string     `json:"name"`
	Headline          string     `json:"headline"`
	Education         string     `json:"education"`
	CurrentRole       string     `json:"current_role"`
	Statement         string     `json:"statement"`
	BioMarkdown       string     `json:"bio_markdown"`
	ResumeMediaID     *string    `json:"resume_media_id"`
	ExpectedUpdatedAt *time.Time `json:"expected_updated_at"`
}

type ContactLinkInput struct {
	Label             string          `json:"label"`
	Kind              ContactLinkKind `json:"kind"`
	URL               string          `json:"url"`
	IconKey           string          `json:"icon_key"`
	SortOrder         int             `json:"sort_order"`
	IsVisible         bool            `json:"is_visible"`
	ExpectedUpdatedAt *time.Time      `json:"expected_updated_at"`
}

type MediaInput struct {
	OriginalName string
	MIMEType     string
	SizeBytes    int64
	Width        int
	Height       int
	AltText      string
}

// The DTOs are transport-facing shapes kept separate from persistence models.
// They intentionally contain only data suitable for API serialization.
type ProjectDTO struct {
	ID              string              `json:"id"`
	Title           string              `json:"title"`
	Slug            string              `json:"slug"`
	Summary         string              `json:"summary"`
	BodyHTML        string              `json:"body_html"`
	PublishedAt     *time.Time          `json:"published_at,omitempty"`
	FeaturedMediaID *string             `json:"featured_media_id,omitempty"`
	Featured        bool                `json:"featured"`
	Tags            []string            `json:"tags"`
	Categories      []string            `json:"categories"`
	Outcome         string              `json:"outcome"`
	Role            string              `json:"role"`
	Technologies    []string            `json:"technologies,omitempty"`
	Stage           ProjectStage        `json:"stage"`
	Availability    ProjectAvailability `json:"availability"`
	Links           []ProjectLink       `json:"links,omitempty"`
	SortOrder       int                 `json:"sort_order"`
}

type BlogPostDTO struct {
	ID                 string     `json:"id"`
	Title              string     `json:"title"`
	Slug               string     `json:"slug"`
	Summary            string     `json:"summary"`
	BodyHTML           string     `json:"body_html"`
	PublishedAt        *time.Time `json:"published_at,omitempty"`
	FeaturedMediaID    *string    `json:"featured_media_id,omitempty"`
	Featured           bool       `json:"featured"`
	Tags               []string   `json:"tags"`
	Categories         []string   `json:"categories"`
	ReadingTimeMinutes int        `json:"reading_time_minutes"`
}

type ProfileDTO struct {
	ID            string  `json:"id"`
	Name          string  `json:"name"`
	Headline      string  `json:"headline"`
	Education     string  `json:"education"`
	CurrentRole   string  `json:"current_role"`
	Statement     string  `json:"statement"`
	BioHTML       string  `json:"bio_html"`
	ResumeMediaID *string `json:"resume_media_id,omitempty"`
}

type ContactLinkDTO struct {
	ID        string          `json:"id"`
	Label     string          `json:"label"`
	Kind      ContactLinkKind `json:"kind"`
	URL       string          `json:"url"`
	IconKey   string          `json:"icon_key"`
	SortOrder int             `json:"sort_order"`
}

type AdminContactLinkDTO struct {
	ContactLinkDTO
	IsVisible bool      `json:"is_visible"`
	UpdatedAt time.Time `json:"updated_at"`
}

// AdminProjectDTO contains editorial and concurrency fields that must not be
// returned by public content endpoints.
type AdminProjectDTO struct {
	ProjectDTO
	Status       Status     `json:"status"`
	BodyMarkdown string     `json:"body_markdown"`
	PublishAt    *time.Time `json:"publish_at,omitempty"`
	ArchivedAt   *time.Time `json:"archived_at,omitempty"`
	UpdatedAt    time.Time  `json:"updated_at"`
	TagIDs       []string   `json:"tag_ids"`
	CategoryIDs  []string   `json:"category_ids"`
}

type AdminBlogPostDTO struct {
	BlogPostDTO
	Status             Status     `json:"status"`
	BodyMarkdown       string     `json:"body_markdown"`
	PublishAt          *time.Time `json:"publish_at,omitempty"`
	ArchivedAt         *time.Time `json:"archived_at,omitempty"`
	UpdatedAt          time.Time  `json:"updated_at"`
	ReadingTimeMinutes int        `json:"reading_time_minutes"`
	TagIDs             []string   `json:"tag_ids"`
	CategoryIDs        []string   `json:"category_ids"`
}

type AdminProfileDTO struct {
	ProfileDTO
	BioMarkdown string    `json:"bio_markdown"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type MediaDTO struct {
	ID        string `json:"id"`
	PublicURL string `json:"public_url"`
	MIMEType  string `json:"mime_type"`
	Width     int    `json:"width,omitempty"`
	Height    int    `json:"height,omitempty"`
	AltText   string `json:"alt_text"`
}

type AdminMediaDTO struct {
	MediaDTO
	OriginalName string    `json:"original_name"`
	SizeBytes    int64     `json:"size_bytes"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// PublicContent reports whether a record may be returned by a public endpoint.
// Scheduled records become public at read time; no background publisher is required.
func (c Content) PublicContent(now time.Time) bool {
	switch c.Status {
	case StatusPublished:
		return true
	case StatusScheduled:
		return c.PublishAt != nil && !now.Before(*c.PublishAt)
	default:
		return false
	}
}

func (c Content) Public() Content {
	c.BodyMarkdown = ""
	return c
}
