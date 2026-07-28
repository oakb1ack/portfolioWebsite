package content

import (
	"fmt"
	"time"
)

func (c Content) ValidateLifecycle() error {
	if !validStatus(c.Status) {
		return fmt.Errorf("invalid content status %q", c.Status)
	}
	if c.Status == StatusScheduled && c.PublishAt == nil {
		return fmt.Errorf("scheduled content requires publish_at")
	}
	if c.Status == StatusPublished && c.PublishedAt == nil {
		return fmt.Errorf("published content requires published_at")
	}
	if c.Status != StatusScheduled && c.Status != StatusPublished && c.PublishAt != nil {
		return fmt.Errorf("publish_at is only valid for scheduled or published content")
	}
	if c.Status != StatusPublished && c.Status != StatusArchived && c.PublishedAt != nil {
		return fmt.Errorf("published_at is only valid for published or archived content")
	}
	if c.Status == StatusArchived && c.ArchivedAt == nil {
		return fmt.Errorf("archived content requires archived_at")
	}
	if c.Status != StatusArchived && c.ArchivedAt != nil {
		return fmt.Errorf("archived_at is only valid for archived content")
	}
	return nil
}

func validStatus(s Status) bool {
	return s == StatusDraft || s == StatusScheduled || s == StatusPublished || s == StatusArchived
}

// Transition returns a copy with a valid lifecycle transition applied.
func (c Content) Transition(to Status, now time.Time) (Content, error) {
	if !validStatus(to) {
		return c, fmt.Errorf("invalid target status %q", to)
	}
	if c.Status == to {
		if err := c.ValidateLifecycle(); err != nil {
			return c, err
		}
		return c, nil
	}
	allowed := (c.Status == StatusDraft && (to == StatusScheduled || to == StatusPublished || to == StatusArchived)) ||
		(c.Status == StatusScheduled && (to == StatusDraft || to == StatusPublished || to == StatusArchived)) ||
		(c.Status == StatusPublished && to == StatusArchived)
	if !allowed {
		return c, fmt.Errorf("cannot transition content from %s to %s", c.Status, to)
	}
	if to == StatusScheduled {
		if c.PublishAt == nil || !c.PublishAt.After(now) {
			return c, fmt.Errorf("scheduled publish_at must be in the future")
		}
	}
	c.Status = to
	switch to {
	case StatusDraft:
		c.PublishAt, c.PublishedAt, c.ArchivedAt = nil, nil, nil
	case StatusPublished:
		c.PublishedAt = timePtr(now)
		c.ArchivedAt = nil
	case StatusArchived:
		c.PublishAt = nil
		c.ArchivedAt = timePtr(now)
	}
	return c, nil
}

func timePtr(t time.Time) *time.Time { return &t }
