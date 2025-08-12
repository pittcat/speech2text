# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Raycast extension for speech-to-text transcription that uses Doubao (ByteDance's AI service) for voice recognition and integrates DeepSeek for text polishing. Users can record audio and get text transcriptions with support for multiple languages and custom settings.

## Development Commands

```bash
# Development and testing
npm run dev          # Start development mode with hot reload in Raycast
npm run dev:debug    # Start development with debug logging enabled (logs to /tmp)
npm run build        # Build the extension for production
npm run lint         # Run ESLint code checks
npm run fix-lint     # Auto-fix ESLint issues
npm run publish      # Publish to Raycast Store

# Testing Doubao API connection
node test-doubao-client.js
```

## Important Files and Paths

- **Debug Log File**: `/tmp/speech-to-text-debug.log` - Only created when using `npm run dev:debug`
- **Debug Guide**: See `DEBUG-GUIDE.md` for detailed debugging instructions
- **Development Guide**: See `DEVELOPMENT.md` for technical implementation details

## Architecture Overview

### Core Components Structure
- **Main UI Components**: `src/record-transcription.tsx` (main recording interface), `src/transcription-history.tsx` (history management), `src/view-logs.tsx` (debugging interface)
- **Audio Recording**: `src/hooks/useAudioRecorder.ts` handles Sox-based 16kHz WAV recording with real-time timing
- **AI Integration**: `src/utils/ai/transcription.ts` orchestrates speech recognition, `src/utils/ai/doubao-client.ts` implements complex WebSocket binary protocol for Doubao, `src/utils/ai/deepseek-client.ts` handles text polishing
- **Data Management**: `src/utils/history.ts` manages transcription records, `src/utils/logger.ts` provides structured logging

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
- Structured logging system with different levels (TRACE, DEBUG, INFO, WARN, ERROR)
- In-app log viewer component for troubleshooting
- Debug mode creates log file at `/tmp/speech-to-text-debug.log`

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

## Common Development Tasks

### Running a Single Test
Since there's no formal test framework, test individual components by:
- Running the specific command in Raycast development mode: `npm run dev`
- Using the standalone test script for API connectivity: `node test-doubao-client.js`
- Creating temporary test files to isolate component behavior

### Debugging WebSocket Issues
- Enable debug logging in Raycast preferences or use `npm run dev:debug`
- View real-time logs through the built-in log viewer (`src/view-logs.tsx`)
- Check WebSocket frame structure in `src/utils/ai/doubao-client.ts`

### Adding New Text Processing Features
1. Add new action type in `src/utils/ai/deepseek-client.ts`
2. Create prompt template in `src/utils/prompt-manager.ts`
3. Update UI in `src/record-transcription.tsx` to include new action
4. Test with different model configurations