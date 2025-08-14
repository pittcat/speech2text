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
- **Smart Processing**: `src/utils/programming-terms-corrector.ts` provides Vibe Coding functionality for programming terminology correction, `src/utils/prompt-manager.ts` manages scenario-based prompt templates
- **Data Management**: `src/utils/history.ts` manages transcription records, `src/utils/logger.ts` provides structured logging, `src/utils/config.ts` handles API credentials and settings

### AI Services Architecture
- **Doubao Engine**: WebSocket-based binary protocol with real-time streaming for speech recognition, requires complex frame handling and authentication
- **DeepSeek Engine**: REST API for text processing and polishing, simpler HTTP-based integration
- **Vibe Coding Engine**: Intelligent programming terms correction system with phonetic mapping and pattern recognition

#### Supported Models
- **Doubao**: Uses ByteDance's speech recognition service for voice-to-text conversion (requires appKey, accessToken, secretKey)
- **DeepSeek**: Supports deepseek-chat and deepseek-coder models for text polishing and processing
- **Vibe Coding**: Built-in programming terminology correction engine with extensive language and framework support

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
- Settings stored via Raycast preferences API and LocalStorage
- Unified API configuration management with one-click save functionality
- Supports language selection (auto-detect or manual) with 11 supported languages
- Custom prompts and terminology for domain-specific transcription
- Context awareness for improved accuracy using highlighted text
- Audio file management with configurable save/delete behavior

## Development Patterns

### Error Handling
- All AI service calls wrapped in try-catch with detailed logging
- User-friendly error messages displayed in Raycast UI
- Fallback mechanisms when one AI service fails
- Automatic retry logic for transient network errors

### State Management
- React hooks for local component state management
- Raycast preferences API for persistent settings
- LocalStorage for API configuration and custom settings
- File-based storage for transcription history
- Session-based state tracking with unique identifiers

### Logging and Debugging
- Structured logging system with different levels (TRACE, DEBUG, INFO, WARN, ERROR)
- In-app log viewer component (`src/view-logs.tsx`) for real-time troubleshooting
- Debug mode creates detailed log file at `/tmp/speech-to-text-debug.log`
- Session correlation with unique IDs for tracking complete workflows
- Automatic log rotation and cleanup mechanisms

### Smart Processing
- Programming content detection using keyword and pattern matching
- Phonetic mapping for common speech recognition errors in technical terms
- Customizable prompt templates for different scenarios
- Intelligent text processing pipeline with multiple correction stages

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
- Requires DEEPSEEK_API_KEY in Raycast preferences or plugin configuration
- Uses REST API for text processing and polishing features
- Supports multiple models: deepseek-chat, deepseek-coder
- Configurable base URL for custom endpoints
- Support for various text processing tasks: 润色、改写、纠错、翻译、扩写、缩写、学术润色

### Vibe Coding Features
- Automatic detection of programming-related content
- Extensive phonetic mapping for programming language names
- Framework and library name correction (React, Vue, Angular, etc.)
- Tool and service name normalization (Docker, Kubernetes, AWS, etc.)
- Custom dictionary support for domain-specific terms

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