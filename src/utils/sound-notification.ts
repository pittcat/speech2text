import { exec } from "child_process";
import { debug } from "./logger";

/**
 * 播放系统提示音
 * macOS 系统声音位于 /System/Library/Sounds/
 */
export enum NotificationSound {
  // 成功提示音
  HERO = "/System/Library/Sounds/Hero.aiff",
  GLASS = "/System/Library/Sounds/Glass.aiff",
  PING = "/System/Library/Sounds/Ping.aiff",
  POP = "/System/Library/Sounds/Pop.aiff",

  // 完成提示音
  SUBMARINE = "/System/Library/Sounds/Submarine.aiff",
  BLOW = "/System/Library/Sounds/Blow.aiff",

  // 提醒音
  BASSO = "/System/Library/Sounds/Basso.aiff",
  FUNK = "/System/Library/Sounds/Funk.aiff",
}

/**
 * 播放系统提示音
 * @param sound 声音文件路径或预定义的声音
 * @param volume 音量 (0-1)，默认 0.5
 */
export function playNotificationSound(
  sound: NotificationSound | string = NotificationSound.GLASS,
  volume: number = 0.5
): void {
  try {
    // 使用 afplay 播放声音，-v 参数控制音量
    const volumeValue = Math.max(0, Math.min(1, volume));
    const command = `afplay -v ${volumeValue} "${sound}"`;

    debug("SoundNotification", "Playing notification sound", {
      sound,
      volume: volumeValue
    });

    exec(command, (error) => {
      if (error) {
        debug("SoundNotification", "Failed to play sound", {
          error: error.message
        });
      }
    });
  } catch (error) {
    debug("SoundNotification", "Error playing notification sound", error);
  }
}

/**
 * 播放转写完成提示音
 */
export function playTranscriptionCompleteSound(): void {
  playNotificationSound(NotificationSound.GLASS, 0.6);
}

/**
 * 播放润色完成提示音
 */
export function playPolishCompleteSound(): void {
  playNotificationSound(NotificationSound.PING, 0.6);
}

/**
 * 播放错误提示音
 */
export function playErrorSound(): void {
  playNotificationSound(NotificationSound.BASSO, 0.5);
}
