package content

import "unicode"

const wordsPerMinute = 200

// ReadingTimeMinutes estimates reading time from Markdown words. Formatting
// punctuation is ignored, while code and link text count as readable content.
// Non-empty content always reports at least one minute.
func ReadingTimeMinutes(markdown string) int {
	words := 0
	inWord := false
	for _, r := range markdown {
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			if !inWord {
				words++
				inWord = true
			}
		} else {
			inWord = false
		}
	}
	if words == 0 {
		return 0
	}
	return (words + wordsPerMinute - 1) / wordsPerMinute
}
