package content

import (
	"bytes"
	"context"

	"github.com/microcosm-cc/bluemonday"
	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/extension"
	"github.com/yuin/goldmark/parser"
)

// GoldmarkRenderer renders CommonMark/GFM and sanitizes the resulting HTML.
// Sanitization remains mandatory even though Goldmark does not execute scripts.
type GoldmarkRenderer struct {
	markdown goldmark.Markdown
	policy   *bluemonday.Policy
}

func NewGoldmarkRenderer() *GoldmarkRenderer {
	return &GoldmarkRenderer{
		markdown: goldmark.New(goldmark.WithExtensions(extension.GFM), goldmark.WithParserOptions(parser.WithAutoHeadingID())),
		policy:   bluemonday.UGCPolicy(),
	}
}

func (r *GoldmarkRenderer) Render(ctx context.Context, markdown string) (string, error) {
	if err := ctx.Err(); err != nil {
		return "", err
	}
	var out bytes.Buffer
	if err := r.markdown.Convert([]byte(markdown), &out); err != nil {
		return "", err
	}
	return r.policy.Sanitize(out.String()), nil
}
