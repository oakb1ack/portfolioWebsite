package httpapi

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"reflect"
	"slices"
	"strings"
	"testing"
	"time"

	"github.com/AliAlfridawi/portfolioWebsite/backend/internal/auth"
	"github.com/AliAlfridawi/portfolioWebsite/backend/internal/content"
)

type contactLinkAdminStub struct {
	ContentAdminStore
	link content.ContactLink
}

type profileAdminStub struct {
	ContentAdminStore
	input   content.ProfileInput
	profile content.Profile
}

func (s contactLinkAdminStub) ListContactLinksAdmin(context.Context) ([]content.ContactLink, error) {
	return []content.ContactLink{s.link}, nil
}

func (s contactLinkAdminStub) CreateContactLink(
	context.Context,
	string,
	content.ContactLinkInput,
) (content.ContactLink, error) {
	return s.link, nil
}

func (s contactLinkAdminStub) UpdateContactLink(
	context.Context,
	string,
	string,
	content.ContactLinkInput,
) (content.ContactLink, error) {
	return s.link, nil
}

func (s *profileAdminStub) UpdateProfile(
	_ context.Context,
	_ string,
	input content.ProfileInput,
) (content.Profile, error) {
	s.input = input
	return s.profile, nil
}

func TestAdminContactLinkResponsesUseAPIFieldNames(t *testing.T) {
	updatedAt := time.Date(2026, time.July, 27, 12, 30, 0, 0, time.UTC)
	link := content.ContactLink{
		ID:        "link-id",
		Label:     "GitHub",
		Kind:      content.ContactExternal,
		URL:       "https://github.com/example",
		IconKey:   "github",
		SortOrder: 3,
		IsVisible: true,
		UpdatedAt: updatedAt,
	}
	deps := RouteDependencies{
		Admin:        contactLinkAdminStub{link: link},
		MaxJSONBytes: 1 << 20,
	}
	mutationBody := `{
		"label":"GitHub",
		"kind":"external",
		"url":"https://github.com/example",
		"icon_key":"github",
		"sort_order":3,
		"is_visible":true,
		"expected_updated_at":"2026-07-27T12:30:00Z"
	}`
	tests := []struct {
		name       string
		method     string
		path       string
		body       string
		handler    http.Handler
		wantStatus int
		list       bool
	}{
		{
			name:       "list",
			method:     http.MethodGet,
			path:       "/admin/contact-links",
			handler:    adminLinks(deps),
			wantStatus: http.StatusOK,
			list:       true,
		},
		{
			name:       "create",
			method:     http.MethodPost,
			path:       "/admin/contact-links",
			body:       mutationBody,
			handler:    createLink(deps),
			wantStatus: http.StatusCreated,
		},
		{
			name:       "update",
			method:     http.MethodPut,
			path:       "/admin/contact-links/link-id",
			body:       mutationBody,
			handler:    updateLink(deps),
			wantStatus: http.StatusOK,
		},
	}

	wantKeys := []string{
		"icon_key", "id", "is_visible", "kind", "label", "sort_order", "updated_at", "url",
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			request := httptest.NewRequest(test.method, test.path, strings.NewReader(test.body))
			request = request.WithContext(context.WithValue(
				request.Context(),
				sessionContextKey,
				auth.Session{AdminID: "admin-id"},
			))
			response := httptest.NewRecorder()

			test.handler.ServeHTTP(response, request)

			if response.Code != test.wantStatus {
				t.Fatalf("status/body = %d/%s", response.Code, response.Body.String())
			}
			var got map[string]any
			if test.list {
				var items []map[string]any
				if err := json.Unmarshal(response.Body.Bytes(), &items); err != nil {
					t.Fatal(err)
				}
				if len(items) != 1 {
					t.Fatalf("items = %d, want 1", len(items))
				}
				got = items[0]
			} else if err := json.Unmarshal(response.Body.Bytes(), &got); err != nil {
				t.Fatal(err)
			}

			gotKeys := make([]string, 0, len(got))
			for key := range got {
				gotKeys = append(gotKeys, key)
			}
			slices.Sort(gotKeys)
			if !reflect.DeepEqual(gotKeys, wantKeys) {
				t.Fatalf("JSON keys = %v, want %v", gotKeys, wantKeys)
			}
			if got["id"] != link.ID || got["updated_at"] != updatedAt.Format(time.RFC3339) {
				t.Fatalf("JSON values = %#v", got)
			}
		})
	}
}

func TestAdminContentDTOsUseArraysForEmptyCollections(t *testing.T) {
	tests := []struct {
		name string
		dto  any
		keys []string
	}{
		{
			name: "project",
			dto:  adminProject(content.Project{}),
			keys: []string{
				"tags", "categories", "tag_ids", "category_ids", "technologies", "links",
			},
		},
		{
			name: "post",
			dto:  adminPost(content.BlogPost{}),
			keys: []string{"tags", "categories", "tag_ids", "category_ids"},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			body, err := json.Marshal(test.dto)
			if err != nil {
				t.Fatal(err)
			}
			var got map[string]any
			if err := json.Unmarshal(body, &got); err != nil {
				t.Fatal(err)
			}
			for _, key := range test.keys {
				value, ok := got[key]
				if !ok {
					t.Errorf("%q is missing from %s", key, body)
					continue
				}
				items, ok := value.([]any)
				if !ok || len(items) != 0 {
					t.Errorf("%q = %#v, want an empty array", key, value)
				}
			}
		})
	}
}

func TestUpdateProfileAllowsFirstRunWithoutExpectedTimestamp(t *testing.T) {
	updatedAt := time.Date(2026, time.July, 27, 13, 0, 0, 0, time.UTC)
	store := &profileAdminStub{profile: content.Profile{
		ID:          "profile",
		Name:        "Site Owner",
		Headline:    "Engineer",
		BioMarkdown: "Biography",
		BioHTML:     "<p>Biography</p>",
		UpdatedAt:   updatedAt,
	}}
	handler := updateProfile(RouteDependencies{
		Admin:        store,
		MaxJSONBytes: 1 << 20,
	})
	request := httptest.NewRequest(http.MethodPut, "/admin/profile", strings.NewReader(`{
		"name":"Site Owner",
		"headline":"Engineer",
		"education":"",
		"current_role":"",
		"statement":"",
		"bio_markdown":"Biography",
		"resume_media_id":null
	}`))
	request = request.WithContext(context.WithValue(
		request.Context(),
		sessionContextKey,
		auth.Session{AdminID: "admin-id"},
	))
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("status/body = %d/%s", response.Code, response.Body.String())
	}
	if store.input.ExpectedUpdatedAt != nil {
		t.Fatalf("expected_updated_at = %v, want nil for first-run upsert", store.input.ExpectedUpdatedAt)
	}
	var got map[string]any
	if err := json.Unmarshal(response.Body.Bytes(), &got); err != nil {
		t.Fatal(err)
	}
	if got["current_role"] != "" || got["bio_markdown"] != "Biography" ||
		got["updated_at"] != updatedAt.Format(time.RFC3339) {
		t.Fatalf("response = %#v", got)
	}
}
