package media

import (
	"bufio"
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

var (
	ErrTooLarge        = errors.New("media exceeds upload limit")
	ErrUnsupportedType = errors.New("unsupported media type")
	ErrInvalidKey      = errors.New("invalid media storage key")
)

var storageKeyPattern = regexp.MustCompile(`^\d{4}/\d{2}/[a-f0-9]{32}\.(jpg|png|gif|webp|pdf)$`)

type StoredFile struct {
	StorageKey   string
	OriginalName string
	MIMEType     string
	SizeBytes    int64
	SHA256       [32]byte
	Width        int
	Height       int
}

type Store struct {
	root     string
	maxBytes int64
	now      func() time.Time
}

func NewStore(root string, maxBytes int64) (*Store, error) {
	if !filepath.IsAbs(root) {
		return nil, errors.New("media root must be an absolute path")
	}
	if maxBytes <= 0 {
		return nil, errors.New("media upload limit must be positive")
	}
	return &Store{root: filepath.Clean(root), maxBytes: maxBytes, now: time.Now}, nil
}

func (s *Store) Save(ctx context.Context, originalName string, source io.Reader) (StoredFile, error) {
	if err := ctx.Err(); err != nil {
		return StoredFile{}, err
	}

	originalName = sanitizeOriginalName(originalName)
	stagingDirectory := filepath.Join(s.root, ".staging")
	if err := os.MkdirAll(stagingDirectory, 0o750); err != nil {
		return StoredFile{}, fmt.Errorf("create media staging directory: %w", err)
	}

	staged, err := os.CreateTemp(stagingDirectory, "upload-*")
	if err != nil {
		return StoredFile{}, fmt.Errorf("create staged media: %w", err)
	}
	stagedName := staged.Name()
	committed := false
	defer func() {
		_ = staged.Close()
		if !committed {
			_ = os.Remove(stagedName)
		}
	}()

	reader := bufio.NewReader(io.LimitReader(source, s.maxBytes+1))
	sniff, err := reader.Peek(512)
	if err != nil && !errors.Is(err, io.EOF) && !errors.Is(err, bufio.ErrBufferFull) {
		return StoredFile{}, fmt.Errorf("inspect media: %w", err)
	}
	mimeType := canonicalMIME(http.DetectContentType(sniff))
	extension, supported := supportedTypes[mimeType]
	if !supported {
		return StoredFile{}, ErrUnsupportedType
	}

	hasher := sha256.New()
	written, err := copyContext(ctx, io.MultiWriter(staged, hasher), reader)
	if err != nil {
		return StoredFile{}, fmt.Errorf("store media: %w", err)
	}
	if written == 0 {
		return StoredFile{}, ErrUnsupportedType
	}
	if written > s.maxBytes {
		return StoredFile{}, ErrTooLarge
	}
	if err := staged.Sync(); err != nil {
		return StoredFile{}, fmt.Errorf("sync staged media: %w", err)
	}
	if _, err := staged.Seek(0, io.SeekStart); err != nil {
		return StoredFile{}, fmt.Errorf("rewind staged media: %w", err)
	}

	width, height := 0, 0
	if strings.HasPrefix(mimeType, "image/") && mimeType != "image/webp" {
		imageConfig, _, decodeErr := image.DecodeConfig(staged)
		if decodeErr != nil {
			return StoredFile{}, fmt.Errorf("%w: invalid %s payload", ErrUnsupportedType, mimeType)
		}
		width, height = imageConfig.Width, imageConfig.Height
	}

	randomID, err := randomHex(16)
	if err != nil {
		return StoredFile{}, fmt.Errorf("generate media key: %w", err)
	}
	now := s.now().UTC()
	key := fmt.Sprintf("%04d/%02d/%s%s", now.Year(), int(now.Month()), randomID, extension)
	destination, err := s.resolveKey(key)
	if err != nil {
		return StoredFile{}, err
	}
	if err := os.MkdirAll(filepath.Dir(destination), 0o750); err != nil {
		return StoredFile{}, fmt.Errorf("create media directory: %w", err)
	}
	if err := staged.Close(); err != nil {
		return StoredFile{}, fmt.Errorf("close staged media: %w", err)
	}
	if err := os.Rename(stagedName, destination); err != nil {
		return StoredFile{}, fmt.Errorf("commit media: %w", err)
	}
	if err := os.Chmod(destination, 0o640); err != nil {
		_ = os.Remove(destination)
		return StoredFile{}, fmt.Errorf("set media permissions: %w", err)
	}
	committed = true

	var digest [32]byte
	copy(digest[:], hasher.Sum(nil))
	return StoredFile{
		StorageKey:   key,
		OriginalName: originalName,
		MIMEType:     mimeType,
		SizeBytes:    written,
		SHA256:       digest,
		Width:        width,
		Height:       height,
	}, nil
}

func (s *Store) Open(storageKey string) (*os.File, error) {
	path, err := s.resolveKey(storageKey)
	if err != nil {
		return nil, err
	}
	return os.Open(path)
}

func (s *Store) Delete(storageKey string) error {
	path, err := s.resolveKey(storageKey)
	if err != nil {
		return err
	}
	if err := os.Remove(path); err != nil && !errors.Is(err, os.ErrNotExist) {
		return err
	}
	return nil
}

func (s *Store) resolveKey(storageKey string) (string, error) {
	if !storageKeyPattern.MatchString(storageKey) {
		return "", ErrInvalidKey
	}
	resolved := filepath.Join(s.root, filepath.FromSlash(storageKey))
	relative, err := filepath.Rel(s.root, resolved)
	if err != nil || relative == ".." || strings.HasPrefix(relative, ".."+string(filepath.Separator)) {
		return "", ErrInvalidKey
	}
	return resolved, nil
}

func copyContext(ctx context.Context, destination io.Writer, source io.Reader) (int64, error) {
	buffer := make([]byte, 32*1024)
	var total int64
	for {
		if err := ctx.Err(); err != nil {
			return total, err
		}
		count, readErr := source.Read(buffer)
		if count > 0 {
			written, writeErr := destination.Write(buffer[:count])
			total += int64(written)
			if writeErr != nil {
				return total, writeErr
			}
			if written != count {
				return total, io.ErrShortWrite
			}
		}
		if errors.Is(readErr, io.EOF) {
			return total, nil
		}
		if readErr != nil {
			return total, readErr
		}
	}
}

func randomHex(size int) (string, error) {
	value := make([]byte, size)
	if _, err := rand.Read(value); err != nil {
		return "", err
	}
	return hex.EncodeToString(value), nil
}

func sanitizeOriginalName(name string) string {
	name = filepath.Base(strings.TrimSpace(name))
	name = strings.Map(func(r rune) rune {
		if r < 0x20 || r == 0x7f {
			return -1
		}
		return r
	}, name)
	if name == "" || name == "." {
		return "upload"
	}
	if len(name) > 255 {
		extension := filepath.Ext(name)
		name = strings.TrimSuffix(name[:255-len(extension)], ".") + extension
	}
	return name
}

func canonicalMIME(value string) string {
	mediaType, _, err := mime.ParseMediaType(value)
	if err != nil {
		return strings.ToLower(strings.TrimSpace(value))
	}
	return strings.ToLower(mediaType)
}

var supportedTypes = map[string]string{
	"image/jpeg":      ".jpg",
	"image/png":       ".png",
	"image/gif":       ".gif",
	"image/webp":      ".webp",
	"application/pdf": ".pdf",
}
