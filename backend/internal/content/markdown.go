package content

import "context"

type MarkdownRenderer interface {
	Render(ctx context.Context, markdown string) (string, error)
}
