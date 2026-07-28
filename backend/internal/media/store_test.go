package media

import (
	"bytes"
	"context"
	"encoding/base64"
	"errors"
	"os"
	"path/filepath"
	"testing"
	"time"
)

const onePixelPNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="

func TestSaveUsesGeneratedKeyAndCanReopen(t *testing.T) {
	root := t.TempDir()
	store, err := NewStore(root, 1024)
	if err != nil {
		t.Fatal(err)
	}
	store.now = func() time.Time { return time.Date(2026, 7, 27, 0, 0, 0, 0, time.UTC) }
	payload, _ := base64.StdEncoding.DecodeString(onePixelPNG)

	stored, err := store.Save(context.Background(), "../../portrait.png", bytes.NewReader(payload))
	if err != nil {
		t.Fatal(err)
	}
	if stored.OriginalName != "portrait.png" {
		t.Fatalf("OriginalName = %q", stored.OriginalName)
	}
	if stored.Width != 1 || stored.Height != 1 {
		t.Fatalf("dimensions = %dx%d, want 1x1", stored.Width, stored.Height)
	}
	if matched, _ := filepath.Match("2026/07/*.png", stored.StorageKey); !matched {
		t.Fatalf("StorageKey = %q", stored.StorageKey)
	}

	file, err := store.Open(stored.StorageKey)
	if err != nil {
		t.Fatal(err)
	}
	defer file.Close()
	info, err := file.Stat()
	if err != nil {
		t.Fatal(err)
	}
	if info.Size() != int64(len(payload)) {
		t.Fatalf("stored size = %d, want %d", info.Size(), len(payload))
	}
}

func TestSaveRejectsOversizedAndUnsupportedFiles(t *testing.T) {
	store, err := NewStore(t.TempDir(), 4)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := store.Save(context.Background(), "file.txt", bytes.NewBufferString("hello")); !errors.Is(err, ErrUnsupportedType) && !errors.Is(err, ErrTooLarge) {
		t.Fatalf("Save() error = %v", err)
	}

	store, _ = NewStore(t.TempDir(), 1024)
	if _, err := store.Save(context.Background(), "file.txt", bytes.NewBufferString("hello")); !errors.Is(err, ErrUnsupportedType) {
		t.Fatalf("Save() error = %v, want ErrUnsupportedType", err)
	}
}

func TestOpenRejectsTraversal(t *testing.T) {
	store, err := NewStore(t.TempDir(), 1024)
	if err != nil {
		t.Fatal(err)
	}
	for _, key := range []string{"../secret", "/etc/passwd", "2026/07/not-valid.png"} {
		if _, err := store.Open(key); !errors.Is(err, ErrInvalidKey) {
			t.Errorf("Open(%q) error = %v, want ErrInvalidKey", key, err)
		}
	}
}

func TestFailedSaveLeavesNoStagedFile(t *testing.T) {
	root := t.TempDir()
	store, _ := NewStore(root, 1024)
	_, _ = store.Save(context.Background(), "bad.txt", bytes.NewBufferString("not media"))

	entries, err := os.ReadDir(filepath.Join(root, ".staging"))
	if err != nil {
		t.Fatal(err)
	}
	if len(entries) != 0 {
		t.Fatalf("staging files left behind: %d", len(entries))
	}
}
