package content

import (
	"fmt"
	"regexp"
	"strings"
	"time"
)

var slugPattern = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)

func GenerateSlug(title string) string {
	var b strings.Builder
	lastDash := false
	for _, r := range strings.ToLower(strings.TrimSpace(title)) {
		if r >= 'a' && r <= 'z' || r >= '0' && r <= '9' {
			b.WriteRune(r)
			lastDash = false
		} else if b.Len() > 0 && !lastDash {
			b.WriteByte('-')
			lastDash = true
		}
	}
	return strings.Trim(b.String(), "-")
}

func ValidateSlug(slug string) error {
	if len(slug) < 1 || len(slug) > 120 || !slugPattern.MatchString(slug) {
		return fmt.Errorf("slug must be 1-120 lowercase letters, numbers, and single hyphens")
	}
	return nil
}

func ValidateSlugChange(current, next string, content Content, now time.Time) error {
	if err := ValidateSlug(next); err != nil {
		return err
	}
	if content.PublicContent(now) && current != next {
		return fmt.Errorf("slug is immutable after becoming public")
	}
	return nil
}

func ValidateProjectSlugChange(current, next string, project Project, now time.Time) error {
	if err := ValidateSlug(next); err != nil {
		return err
	}
	// Editorial publication locks the canonical URL even when the underlying
	// project is marked private. Availability may change later, and a private
	// project can still have been shared through an authenticated preview.
	if project.Content.PublicContent(now) && current != next {
		return fmt.Errorf("slug is immutable after becoming public")
	}
	return nil
}
