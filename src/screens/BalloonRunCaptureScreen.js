import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Video, ResizeMode } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SIZES } from '../utils/theme';
import {
  getChildren,
  moveVideoToBalloonStorage,
  saveBalloonRun,
} from '../utils/storage';
import SpeedSelector from '../components/SpeedSelector';

function calculateAge(birthdayISO) {
  const birth = new Date(birthdayISO);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function formatTimer(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ─── Recording Pulse Dot ───

function PulsingDot() {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return <Animated.View style={[styles.recordDot, { opacity }]} />;
}

// ─── Main Screen ───

export default function BalloonRunCaptureScreen({ route, navigation }) {
  const { childId, childName } = route.params;

  // Camera
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  // State
  const [phase, setPhase] = useState('choose'); // 'choose' | 'recording' | 'preview'
  const [facing, setFacing] = useState('back');
  const [isRecording, setIsRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef(null);

  // Preview state
  const [tempVideoUri, setTempVideoUri] = useState(null);
  const [playbackRate, setPlaybackRate] = useState(0.5);
  const videoRef = useRef(null);

  // Timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  // Update playback rate on video when changed
  useEffect(() => {
    if (videoRef.current && phase === 'preview') {
      videoRef.current.setRateAsync(playbackRate, false);
    }
  }, [playbackRate, phase]);

  // ─── Gallery pick ───

  async function pickFromGallery() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      quality: 1,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setTempVideoUri(result.assets[0].uri);
      setPhase('preview');
    }
  }

  // ─── Recording ───

  async function startRecording() {
    if (!cameraRef.current) return;
    setPhase('recording');
    setIsRecording(true);
    setTimer(0);

    try {
      const result = await cameraRef.current.recordAsync();
      if (result?.uri) {
        setTempVideoUri(result.uri);
        setPhase('preview');
      }
    } catch (e) {
      console.warn('Recording error:', e);
      Alert.alert('Recording Error', 'Something went wrong. Please try again.');
      setPhase('choose');
      setIsRecording(false);
    }
  }

  function stopRecording() {
    if (!cameraRef.current) return;
    cameraRef.current.stopRecording();
    setIsRecording(false);
  }

  // ─── Save ───

  async function handleSave() {
    if (!tempVideoUri) return;
    setSaving(true);
    try {
      // Preserve file extension from source
      const ext = tempVideoUri.split('.').pop() || 'mp4';
      const filename = `balloon_${childId}_${Date.now()}.${ext}`;
      const storedUri = await moveVideoToBalloonStorage(tempVideoUri, filename);

      const children = await getChildren();
      const child = children.find((c) => c.id === childId);
      const age = child ? calculateAge(child.birthday) : null;

      const run = {
        id: generateId(),
        childId,
        year: new Date().getFullYear(),
        age,
        videoUri: storedUri,
        playbackRate,
        createdAt: new Date().toISOString(),
      };

      await saveBalloonRun(run);
      navigation.goBack();
    } catch (e) {
      console.warn('Save error:', e);
      Alert.alert('Save Error', 'Could not save the balloon run. Please try again.');
      setSaving(false);
    }
  }

  function handleDiscard() {
    Alert.alert('Discard Video', 'Are you sure you want to discard this video?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          setTempVideoUri(null);
          setPhase('choose');
        },
      },
    ]);
  }

  // ─── Permission handling ───

  if (!permission || !micPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.permissionText}>Loading camera...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted || !micPermission.granted) {
    const needsCamera = !permission.granted;
    const needsMic = !micPermission.granted;
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🎈</Text>
          <Text style={styles.permissionTitle}>Permissions Needed</Text>
          <Text style={styles.permissionText}>
            We need camera and microphone access to record the balloon run.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={async () => {
              if (needsCamera) await requestPermission();
              if (needsMic) await requestMicPermission();
            }}
          >
            <Text style={styles.primaryButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.textButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.textButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Phase: Choose Mode ───

  if (phase === 'choose') {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          mode="video"
          facing={facing}
        />

        {/* Flip button */}
        <TouchableOpacity
          style={styles.flipButton}
          onPress={() => setFacing(facing === 'front' ? 'back' : 'front')}
        >
          <Text style={styles.flipButtonText}>Flip</Text>
        </TouchableOpacity>

        {/* Bottom overlay */}
        <View style={styles.chooseOverlay}>
          <Text style={styles.chooseTitle}>🎈 Balloon Run</Text>
          <Text style={styles.chooseSubtitle}>{childName}</Text>
          <Text style={styles.chooseTip}>
            Tip: For the smoothest slow-mo, record with your phone's native camera in slo-mo mode, then upload here.
          </Text>

          <TouchableOpacity style={styles.recordButton} onPress={startRecording}>
            <View style={styles.recordIconOuter}>
              <View style={styles.recordIconInner} />
            </View>
            <Text style={styles.recordButtonText}>Record Video</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.galleryButton} onPress={pickFromGallery}>
            <Text style={styles.galleryButtonText}>Choose from Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.textButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.textButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── Phase: Recording ───

  if (phase === 'recording') {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          mode="video"
          facing={facing}
        />

        {/* Top bar */}
        <SafeAreaView style={styles.recordingTopBar}>
          <View style={styles.recordingTopRow}>
            <View style={styles.recordingIndicator}>
              <PulsingDot />
              <Text style={styles.recordingIndicatorText}>REC</Text>
            </View>
            <Text style={styles.timerText}>{formatTimer(timer)}</Text>
            <TouchableOpacity
              style={styles.flipButtonSmall}
              onPress={() => setFacing(facing === 'front' ? 'back' : 'front')}
            >
              <Text style={styles.flipButtonSmallText}>Flip</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Bottom: stop button */}
        <View style={styles.recordingBottomPanel}>
          <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
            <View style={styles.stopIcon} />
            <Text style={styles.stopButtonText}>Stop Recording</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── Phase: Preview ───

  if (phase === 'preview') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.previewContent}>
          <Text style={styles.previewTitle}>🎈 Preview</Text>

          <View style={styles.videoCard}>
            {tempVideoUri ? (
              <Video
                ref={videoRef}
                source={{ uri: tempVideoUri }}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                style={styles.video}
                rate={playbackRate}
                shouldCorrectPitch={false}
                isLooping
              />
            ) : (
              <View style={styles.videoPlaceholder}>
                <Text style={{ fontSize: 40 }}>🎈</Text>
                <Text style={styles.placeholderText}>No video</Text>
              </View>
            )}
          </View>

          <SpeedSelector
            selectedRate={playbackRate}
            onRateChange={setPlaybackRate}
          />

          <View style={styles.previewActions}>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.saveButtonText}>Save Balloon Run</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.discardButton}
              onPress={handleDiscard}
              disabled={saving}
            >
              <Text style={styles.discardButtonText}>Discard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return null;
}

// ─── Styles ───

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.paddingXl,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: COLORS.black,
  },

  // Permission
  permissionTitle: {
    fontSize: SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: SIZES.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },

  // Buttons
  primaryButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: SIZES.radiusFull,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: SIZES.lg,
    fontWeight: '700',
    textAlign: 'center',
  },
  textButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  textButtonText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: SIZES.base,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Flip
  flipButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: SIZES.radiusFull,
  },
  flipButtonText: {
    color: COLORS.white,
    fontSize: SIZES.md,
    fontWeight: '600',
  },

  // ─── Choose Mode ───
  chooseOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    padding: SIZES.paddingLg,
    paddingBottom: 40,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  chooseTitle: {
    fontSize: SIZES.xxl,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
  },
  chooseSubtitle: {
    fontSize: SIZES.lg,
    color: COLORS.accent,
    fontWeight: '600',
    marginBottom: 12,
  },
  chooseTip: {
    fontSize: SIZES.sm,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.recording,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: SIZES.radiusFull,
    marginBottom: 12,
    shadowColor: COLORS.recording,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  recordIconOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  recordIconInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.white,
  },
  recordButtonText: {
    color: COLORS.white,
    fontSize: SIZES.lg,
    fontWeight: '700',
  },
  galleryButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: SIZES.radiusFull,
    marginBottom: 8,
  },
  galleryButtonText: {
    color: COLORS.white,
    fontSize: SIZES.base,
    fontWeight: '600',
  },

  // ─── Recording ───
  recordingTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: SIZES.padding,
    paddingTop: 8,
  },
  recordingTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: SIZES.radiusFull,
  },
  recordDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.recording,
    marginRight: 6,
  },
  recordingIndicatorText: {
    color: COLORS.recording,
    fontSize: SIZES.sm,
    fontWeight: '700',
  },
  timerText: {
    color: COLORS.white,
    fontSize: SIZES.lg,
    fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: SIZES.radiusFull,
  },
  flipButtonSmall: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: SIZES.radiusFull,
  },
  flipButtonSmallText: {
    color: COLORS.white,
    fontSize: SIZES.sm,
    fontWeight: '600',
  },
  recordingBottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 50,
    paddingTop: SIZES.paddingLg,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.recording,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: SIZES.radiusFull,
  },
  stopIcon: {
    width: 14,
    height: 14,
    backgroundColor: COLORS.white,
    borderRadius: 2,
    marginRight: 8,
  },
  stopButtonText: {
    color: COLORS.white,
    fontSize: SIZES.lg,
    fontWeight: '700',
  },

  // ─── Preview ───
  previewContent: {
    flex: 1,
    padding: SIZES.padding,
  },
  previewTitle: {
    fontSize: SIZES.xxl,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.padding,
    marginTop: SIZES.padding,
  },
  videoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    marginBottom: SIZES.padding,
  },
  video: {
    width: '100%',
    height: 300,
  },
  videoPlaceholder: {
    width: '100%',
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceAlt,
  },
  placeholderText: {
    fontSize: SIZES.md,
    color: COLORS.textLight,
    marginTop: 8,
  },
  previewActions: {
    marginTop: SIZES.paddingLg,
    gap: 12,
  },
  saveButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    borderRadius: SIZES.radiusFull,
    alignItems: 'center',
    shadowColor: COLORS.accentDark,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: SIZES.lg,
    fontWeight: '700',
  },
  discardButton: {
    paddingVertical: 14,
    borderRadius: SIZES.radiusFull,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  discardButtonText: {
    color: COLORS.textSecondary,
    fontSize: SIZES.base,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
