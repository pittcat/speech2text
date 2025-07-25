import { useState, useEffect } from "react";
import {
  Action,
  ActionPanel,
  Form,
  Clipboard,
  showToast,
  Toast,
  getPreferenceValues,
  getSelectedText,
  launchCommand,
  LaunchType,
} from "@raycast/api";
import { useForm, showFailureToast } from "@raycast/utils";
import { transcribeAudio } from "./utils/ai/transcription";
import { useAudioRecorder } from "./hooks/useAudioRecorder";
import { DoubaoPreferences } from "./types";
import { LANGUAGE_OPTIONS } from "./constants";

interface TranscriptFormValues {
  transcription: string;
  language: string;
  promptText: string;
  userTerms: string;
  useContext: boolean;
}

export default function Command() {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const preferences = getPreferenceValues<DoubaoPreferences>();

  const { isRecording, recordingDuration, error, startRecording, stopRecording } = useAudioRecorder();

  const { handleSubmit, itemProps, setValue, values } = useForm<TranscriptFormValues>({
    onSubmit: handleCopyToClipboard,
    initialValues: {
      transcription: "",
      language: preferences.language ?? "auto",
      promptText: preferences.promptText ?? "",
      userTerms: preferences.userTerms ?? "",
      useContext: preferences.enableContext ?? true,
    },
  });

  async function handleCopyToClipboard(values: TranscriptFormValues) {
    if (!values.transcription) return;

    await Clipboard.copy(values.transcription);
    await showToast({
      style: Toast.Style.Success,
      title: "Copied to clipboard",
    });
  }

  async function handleTranscription(recordingFilePath: string) {
    try {
      const languageTitle =
        values.language === "auto"
          ? "Auto-detect"
          : (LANGUAGE_OPTIONS.find((option) => option.value === values.language)?.title ?? "Auto-detect");

      await showToast({
        style: Toast.Style.Animated,
        title: "Transcribing...",
        message: `Language: ${languageTitle}`,
      });

      let selection = "";
      try {
        selection = await getSelectedText();
      } catch (error) {
        console.error("Error getting selected text:", error);
        if (values.useContext) {
          await showFailureToast(error, {
            title: "Context Error",
          });
        }
      }

      const result = await transcribeAudio(recordingFilePath, {
        overrideLanguage: values.language,
        promptOptions: {
          promptText: values.promptText,
          userTerms: values.userTerms,
          highlightedText: values.useContext ? selection : undefined,
        },
      });

      setValue("transcription", result.text);
      await handleCopyToClipboard({ ...values, transcription: result.text });

      await showToast({
        style: Toast.Style.Success,
        title: "Transcription complete",
        message: "Text copied to clipboard",
      });
    } catch (error) {
      console.error("Transcription error:", error);
      await showFailureToast(error, {
        title: "Transcription failed",
      });
    }
  }

  const handleStopRecording = async () => {
    console.log("handleStopRecording called - user wants to stop recording");
    console.log(`Current recording state: isRecording=${isRecording}, duration=${recordingDuration}s`);
    
    const recordingFilePath = await stopRecording();
    console.log("stopRecording returned:", recordingFilePath);
    
    if (recordingFilePath) {
      setIsTranscribing(true);
      console.log("Starting transcription process...");
      await handleTranscription(recordingFilePath);
      setIsTranscribing(false);
      console.log("Transcription process completed");
    } else {
      console.log("No recording file path returned from stopRecording");
    }
  };

  const handleNewRecording = () => {
    console.log("handleNewRecording called - user wants to start new recording");
    console.log(`Current state before starting: isRecording=${isRecording}, isTranscribing=${isTranscribing}`);
    
    setValue("transcription", "");
    startRecording().then((result) => {
      console.log("startRecording completed with result:", result);
    }).catch((error) => {
      console.error("startRecording failed:", error);
    });
  };

  useEffect(() => {
    if (error) {
      void showFailureToast(error, {
        title: "Error",
      });
    }
  }, [error]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getPlaceholder = () => {
    if (isRecording) {
      return `Recording in progress... (${formatDuration(recordingDuration)})`;
    }
    if (isTranscribing) {
      return "Transcribing your audio...";
    }
    return "Start recording with ⌘+R";
  };

  const getTitle = () => {
    if (isRecording) {
      return "Recording";
    }
    if (isTranscribing) {
      return "Transcribing";
    }
    return "Speech to Text";
  };

  return (
    <Form
      isLoading={isTranscribing}
      actions={
        <ActionPanel>
          {!isRecording && (
            <Action title="Start Recording" onAction={handleNewRecording} shortcut={{ modifiers: ["cmd"], key: "r" }} />
          )}

          {isRecording && (
            <Action title="Stop Recording" onAction={handleStopRecording} shortcut={{ modifiers: ["cmd"], key: "s" }} />
          )}

          <Action.SubmitForm
            title="Copy to Clipboard"
            onSubmit={handleSubmit}
            shortcut={{ modifiers: ["cmd"], key: "c" }}
          />

          <Action title="New Recording" onAction={handleNewRecording} shortcut={{ modifiers: ["cmd"], key: "n" }} />

          <Action
            title="View History"
            onAction={() =>
              launchCommand({
                name: "transcription-history",
                type: LaunchType.UserInitiated,
              })
            }
            shortcut={{ modifiers: ["cmd", "shift"], key: "h" }}
          />
        </ActionPanel>
      }
    >
      <Form.TextArea
        {...itemProps.transcription}
        title={getTitle()}
        placeholder={getPlaceholder()}
        enableMarkdown={false}
        autoFocus
      />

      <Form.Separator />

      <Form.TextArea
        {...itemProps.promptText}
        title="Prompt"
        placeholder="Custom instructions to guide the AI transcription"
        info="Instructions for how the AI should approach the transcription"
      />

      <Form.TextField
        {...itemProps.userTerms}
        title="Custom Terms"
        placeholder="React.js, TypeScript, GraphQL, John Doe"
        info="Comma-separated list of specialized terms, names, or jargon"
      />

      <Form.Checkbox
        {...itemProps.useContext}
        title="Use Highlighted Text"
        label={`Use highlighted text as context`}
        info="Uses any text you have highlighted in another app as context for transcription"
      />

      <Form.Dropdown
        {...itemProps.language}
        title="Language"
        info="Select a language for better transcription accuracy"
      >
        {LANGUAGE_OPTIONS.map((option) => (
          <Form.Dropdown.Item key={option.value} value={option.value} title={option.title} />
        ))}
      </Form.Dropdown>

    </Form>
  );
}
