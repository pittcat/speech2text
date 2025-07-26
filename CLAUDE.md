# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Raycast extension for speech-to-text transcription that uses Doubao (ByteDance's AI service) for voice recognition and integrates DeepSeek for text polishing. Users can record audio and get text transcriptions with support for multiple languages and custom settings.

## Development Commands

```bash
# Development and testing
npm run dev          # Start development mode with hot reload in Raycast
npm run build        # Build the extension for production
npm run lint         # Run ESLint code checks
npm run fix-lint     # Auto-fix ESLint issues
npm run publish      # Publish to Raycast Store

# Testing Doubao API connection
node test-doubao-client.js
```

## Important Files and Paths

- **Log File**: `/Users/pittcat/Dev/Python/speech-to-text/speech-to-text-debug.log` - Automatically cleared on each startup
- **Debug Guide**: See `DEBUG-GUIDE.md` for detailed debugging instructions
- **Development Guide**: See `DEVELOPMENT.md` for technical implementation details

## Architecture Overview

### Core Components Structure
- **Main UI Components**: `record-transcription.tsx` (main recording interface), `transcription-history.tsx` (history management), `view-logs.tsx` (debugging interface)
- **Audio Recording**: `hooks/useAudioRecorder.ts` handles Sox-based 16kHz WAV recording with real-time timing
- **AI Integration**: `utils/ai/transcription.ts` orchestrates speech recognition, `utils/ai/doubao-client.ts` implements complex WebSocket binary protocol for Doubao, `utils/ai/deepseek-client.ts` handles text polishing
- **Data Management**: `utils/history.ts` manages transcription records, `utils/logger.ts` provides structured logging

### AI Services Architecture
- **Doubao Engine**: WebSocket-based binary protocol with real-time streaming for speech recognition, requires complex frame handling and authentication
- **DeepSeek Engine**: REST API for text processing and polishing, simpler HTTP-based integration

#### Supported Models
- **Doubao**: Uses ByteDance's speech recognition service for voice-to-text conversion
- **DeepSeek**: Supports deepseek-chat and deepseek-coder models for text polishing and processing

## Key Technical Details

### Audio Recording Requirements
- Uses Sox command-line tool for audio capture
- Fixed format: 16kHz, 16-bit, mono WAV files
- Real-time recording with start/stop controls
- Audio files are temporarily stored and cleaned up after transcription

### Doubao WebSocket Protocol
- Binary message format with specific frame structures
- Authentication via app_id, token, and cluster parameters  
- Streaming audio data in chunks with proper sequencing
- Real-time result parsing from binary responses

### Configuration Management
- Settings stored via Raycast preferences API
- Supports language selection (auto-detect or manual)
- Custom prompts and terminology for domain-specific transcription
- Context awareness for improved accuracy

## Development Patterns

### Error Handling
- All AI service calls wrapped in try-catch with detailed logging
- User-friendly error messages displayed in Raycast UI
- Fallback mechanisms when one AI service fails

### State Management
- React hooks for local component state
- Raycast preferences for persistent settings
- File-based storage for transcription history

### Logging and Debugging
- Structured logging system with different levels (debug, info, error)
- In-app log viewer component for troubleshooting
- Debug guide available in DEBUG-GUIDE.md

## Testing Approach

- No formal test framework configured
- Manual testing through `npm run dev` in Raycast development mode
- Standalone test script `test-doubao-client.js` for API connectivity
- Built-in logging system for debugging issues

## Raycast-Specific Considerations

- Extension manifest configured in package.json
- Uses @raycast/api for UI components and system integration
- Follows Raycast's design patterns and user experience guidelines
- Commands configured for different entry points (record, history, logs)

## API Configuration

### Doubao API
- Test credentials available in `test-doubao-client.js`
- Requires app_id, token, and cluster parameters
- Uses WebSocket connection to wss://openspeech.bytedance.com

### DeepSeek API
- Requires DEEPSEEK_API_KEY in Raycast preferences
- Uses REST API for text processing and polishing features
- Supports multiple models: deepseek-chat, deepseek-coder