// ─────────────────────────────────────────────────────────────
//  HiWox Weekly Check-In Screen
//  Fetches questions from backend · saves answers to backend
// ─────────────────────────────────────────────────────────────

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Dimensions,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { checkInApi, CheckInDomain } from '../../../services/checkInApi';
import { CheckInField } from '../config only/components/checkin/CheckInFormComponents';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────
type FormValues = Record<string, any>;

// ─────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────
const buildInitialState = (questions: any[]): FormValues =>
  questions.reduce((acc, q) => ({ ...acc, [q.id]: null }), {});

const domainProgress = (domain: CheckInDomain, values: FormValues): number => {
  const questions = domain.questions || [];
  const answered = questions.filter((q) => values[q.id] !== null && values[q.id] !== undefined);
  if (questions.length === 0) return 1;
  return answered.length / questions.length;
};

const overallProgress = (domains: CheckInDomain[], values: FormValues): number => {
  const allQuestions = domains.flatMap((d) => d.questions || []);
  if (allQuestions.length === 0) return 1;
  const answered = allQuestions.filter((q) => values[q.id] !== null && values[q.id] !== undefined);
  return answered.length / allQuestions.length;
};

// ─────────────────────────────────────────────────────────────
//  Domain Stepper Header
// ─────────────────────────────────────────────────────────────
interface DomainStepperProps {
  domains: CheckInDomain[];
  activeDomainIndex: number;
  values: FormValues;
  onSelect: (index: number) => void;
}

const DomainStepper: React.FC<DomainStepperProps> = ({
  domains,
  activeDomainIndex,
  values,
  onSelect,
}) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={stepperStyles.container}
  >
    {domains.map((domain, i) => {
      const isActive = i === activeDomainIndex;
      const progress = domainProgress(domain, values);
      const isDone = progress === 1;

      return (
        <TouchableOpacity
          key={domain.id || domain.label}
          onPress={() => onSelect(i)}
          activeOpacity={0.75}
          style={[
            stepperStyles.pill,
            isActive && { borderColor: domain.color, backgroundColor: (domain.color || '#667eea') + '18' },
            isDone && !isActive && { borderColor: (domain.color || '#667eea') + '55' },
          ]}
        >
          {isDone && (
            <View style={[stepperStyles.doneRing, { borderColor: domain.color }]}>
              <Text style={{ fontSize: 9, color: domain.color }}>✓</Text>
            </View>
          )}
          <Text style={stepperStyles.pillIcon}>{domain.icon || '🎯'}</Text>
          <Text
            style={[
              stepperStyles.pillLabel,
              isActive && { color: domain.color },
              isDone && !isActive && { color: (domain.color || '#667eea') + 'AA' },
            ]}
          >
            {domain.label}
          </Text>
          {isActive && (
            <View style={stepperStyles.pillProgressTrack}>
              <View
                style={[
                  stepperStyles.pillProgressFill,
                  { width: `${progress * 100}%`, backgroundColor: domain.color },
                ]}
              />
            </View>
          )}
        </TouchableOpacity>
      );
    })}
  </ScrollView>
);

const stepperStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    gap: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  doneRing: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillIcon: { fontSize: 15 },
  pillLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  pillProgressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  pillProgressFill: {
    height: '100%',
    borderRadius: 1,
  },
});

// ─────────────────────────────────────────────────────────────
//  Overall Progress Bar
// ─────────────────────────────────────────────────────────────
const OverallProgressBar: React.FC<{ progress: number }> = ({ progress }) => {
  const pct = Math.round(progress * 100);
  return (
    <View style={progressStyles.wrapper}>
      <View style={progressStyles.track}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[progressStyles.fill, { width: `${pct}%` }]}
        />
      </View>
      <Text style={progressStyles.label}>{pct}% complete</Text>
    </View>
  );
};

const progressStyles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  track: {
    flex: 1,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
    minWidth: 6,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    width: 80,
    textAlign: 'right',
  },
});

// ─────────────────────────────────────────────────────────────
//  Domain Panel — questions for one domain
// ─────────────────────────────────────────────────────────────
interface DomainPanelProps {
  domain: CheckInDomain;
  values: FormValues;
  onChange: (field: string, value: any) => void;
  onNext: () => void;
  onPrev: () => void;
  isFirst: boolean;
  isLast: boolean;
  domains: CheckInDomain[];
}

const DomainPanel: React.FC<DomainPanelProps> = ({
  domain,
  values,
  onChange,
  onNext,
  onPrev,
  isFirst,
  isLast,
  domains,
}) => {
  const progress = domainProgress(domain, values);
  const canProceed = progress > 0;
  const currentIndex = domains.findIndex(
    (d) => (d.id || d.domainId) === (domain.id || domain.domainId)
  );
  const nextDomain = currentIndex < domains.length - 1 ? domains[currentIndex + 1] : undefined;

  return (
    <View style={panelStyles.container}>
      {/* Domain header card */}
      <LinearGradient
        colors={[
          (domain.gradientColors?.[0] || '#667eea') + '22',
          (domain.gradientColors?.[1] || '#764ba2') + '11',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={panelStyles.domainHeader}
      >
        <View style={[panelStyles.domainIconCircle, { borderColor: (domain.color || '#667eea') + '55' }]}>
          <Text style={panelStyles.domainIcon}>{domain.icon || '🎯'}</Text>
        </View>
        <View style={panelStyles.domainHeaderText}>
          <Text style={[panelStyles.domainTitle, { color: domain.color || '#667eea' }]}>
            {domain.label} Wellness
          </Text>
          <Text style={panelStyles.domainSubtitle}>
            {(domain.questions || []).length} questions
          </Text>
        </View>
        <View style={[panelStyles.progressPill, { borderColor: (domain.color || '#667eea') + '44' }]}>
          <Text style={[panelStyles.progressPillText, { color: domain.color || '#667eea' }]}>
            {Math.round(progress * 100)}%
          </Text>
        </View>
      </LinearGradient>

      {/* Questions */}
      {(domain.questions || []).map((question) => (
        <CheckInField
          key={question.id}
          question={question}
          value={values[question.id]}
          onChange={onChange}
          accentColor={domain.color || '#667eea'}
        />
      ))}

      {/* Navigation buttons */}
      <View style={panelStyles.navRow}>
        {!isFirst && (
          <TouchableOpacity
            onPress={onPrev}
            activeOpacity={0.7}
            style={panelStyles.navBtnOutline}
          >
            <Text style={panelStyles.navBtnOutlineText}>← Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={onNext}
          activeOpacity={0.7}
          style={{ flex: 1 }}
        >
          <LinearGradient
            colors={
              canProceed
                ? [domain.gradientColors?.[0] || '#667eea', domain.gradientColors?.[1] || '#764ba2']
                : ['#1F2937', '#1F2937']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={panelStyles.navBtnFilled}
          >
            <Text style={[panelStyles.navBtnFilledText, !canProceed && { color: '#4B5563' }]}>
              {isLast ? '✓  Submit Check-In' : `Next: ${nextDomain?.label ?? ''} →`}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const panelStyles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingBottom: 40 },
  domainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    marginBottom: 28,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  domainIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  domainIcon: { fontSize: 24 },
  domainHeaderText: { flex: 1 },
  domainTitle: { fontSize: 17, fontWeight: '700', marginBottom: 3 },
  domainSubtitle: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  progressPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  progressPillText: { fontSize: 13, fontWeight: '700' },
  navRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  navBtnOutline: {
    flex: 0.45,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBtnOutlineText: { fontSize: 15, fontWeight: '600', color: '#9CA3AF' },
  navBtnFilled: { height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  navBtnFilledText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});

// ─────────────────────────────────────────────────────────────
//  Completion Screen
// ─────────────────────────────────────────────────────────────
const CompletionScreen: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <View style={completionStyles.container}>
    <LinearGradient colors={['#1A1A2E', '#16213E']} style={StyleSheet.absoluteFill} />
    <View style={completionStyles.card}>
      <Text style={completionStyles.emoji}>🎉</Text>
      <Text style={completionStyles.title}>Check-In Complete!</Text>
      <Text style={completionStyles.subtitle}>
        Your wellness data has been submitted.{'\n'}
        Your coordinator will review it and your{'\n'}
        weekly report arrives on Friday.
      </Text>
      <TouchableOpacity onPress={onClose} activeOpacity={0.8}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={completionStyles.btn}
        >
          <Text style={completionStyles.btnText}>Back to Dashboard</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  </View>
);

const completionStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: {
    alignItems: 'center',
    gap: 16,
    padding: 32,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    width: '100%',
    maxWidth: 380,
  },
  emoji: { fontSize: 56, marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#9CA3AF', textAlign: 'center', lineHeight: 22, fontWeight: '500' },
  btn: { paddingHorizontal: 40, paddingVertical: 16, borderRadius: 16, marginTop: 8 },
  btnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});

// ─────────────────────────────────────────────────────────────
//  WeeklyCheckInScreen — root export
// ─────────────────────────────────────────────────────────────
export default function WeeklyCheckInScreen() {
  const router = useRouter();

  const [domains, setDomains] = useState<CheckInDomain[]>([]);
  const [isLoadingDomains, setIsLoadingDomains] = useState(true);
  const [domainsError, setDomainsError] = useState<string | null>(null);
  const [values, setValues] = useState<FormValues>({});
  const [activeDomainIndex, setActiveDomainIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const activeDomain = domains[activeDomainIndex];
  const totalDomains = domains.length;
  const progress = overallProgress(domains, values);

  // Load domains from backend + userId from storage
  useEffect(() => {
    const loadDomains = async () => {
      setIsLoadingDomains(true);
      setDomainsError(null);
      try {
        console.log('🔄 [Screen] Starting to load domains...');
        const data = await checkInApi.getCheckInQuestions();
        console.log('📦 [Screen] Raw API response:', data);

        const domainsArray = Array.isArray(data) ? data : Object.values(data);
        console.log('📊 [Screen] Number of domains:', domainsArray.length);

        const domainsWithQuestions = domainsArray.map((d: any) => ({
          ...d,
          questions: d.questions || [],
        }));

        if (domainsWithQuestions.length === 0) {
          throw new Error('No domains returned from backend');
        }
        const totalQuestions = domainsWithQuestions.reduce(
          (sum, d) => sum + (d.questions?.length || 0),
          0
        );
        if (totalQuestions === 0) {
          throw new Error('No questions found in any domain');
        }

        console.log('✅ [Screen] Domains loaded successfully');
        setDomains(domainsWithQuestions);
        setValues(buildInitialState(domainsWithQuestions.flatMap((d) => d.questions || [])));
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Failed to load check-in questions';
        console.error('❌ [Screen] Error loading domains:', error);
        setDomainsError(msg);
        Alert.alert('Error Loading Check-In', msg);
      } finally {
        setIsLoadingDomains(false);
      }
    };

    const loadUserId = async () => {
      const id = await AsyncStorage.getItem('userId');
      if (!id) console.warn('⚠️  [Screen] No user ID in AsyncStorage');
      setUserId(id);
    };

    loadDomains();
    loadUserId();
  }, []);

  const handleChange = useCallback((field: string, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const scrollToTop = () => scrollRef.current?.scrollTo({ y: 0, animated: true });

  const handleNext = () => {
    if (activeDomainIndex < totalDomains - 1) {
      setActiveDomainIndex((i) => i + 1);
      scrollToTop();
    } else {
      handleSubmit();
    }
  };

  const handlePrev = () => {
    if (activeDomainIndex > 0) {
      setActiveDomainIndex((i) => i - 1);
      scrollToTop();
    }
  };

  const handleSelectDomain = (index: number) => {
    setActiveDomainIndex(index);
    scrollToTop();
  };

  const handleSubmit = () => {
    const unanswered = domains.filter((d) =>
      (d.questions || []).every((q) => values[q.id] === null || values[q.id] === undefined)
    );
    if (unanswered.length > 0) {
      Alert.alert(
        'Incomplete Check-In',
        `Please answer at least one question in: ${unanswered.map((d) => d.label).join(', ')}`,
        [{ text: 'OK' }]
      );
      return;
    }
    setShowPreview(true);
  };

  const handleConfirmSubmit = async () => {
    if (!userId) {
      Alert.alert('Error', 'User ID not found. Please log in again.');
      return;
    }
    console.log('📤 [Screen] Starting check-in submission');
    setIsSubmitting(true);
    try {
      const cleanedAnswers = Object.fromEntries(
        Object.entries(values).filter(([_, value]) => value !== null && value !== undefined)
      );
      console.log('🚀 CLEANED VALUES:', cleanedAnswers);
      await checkInApi.submitCheckIn(userId, cleanedAnswers);
      console.log('✅ [Screen] Check-in submitted successfully!');
      setShowPreview(false);
      setSubmitted(true);
      setValues(buildInitialState(domains.flatMap((d) => d.questions || [])));
      setActiveDomainIndex(0);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to submit check-in';
      console.error('❌ [Screen] Error during submission:', error);
      Alert.alert('Submission Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Loading state ──
  if (isLoadingDomains) {
    return (
      <View style={screenStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={screenStyles.loadingText}>Loading check-in form...</Text>
      </View>
    );
  }

  // ── Error state ──
  if (domainsError) {
    return (
      <View style={screenStyles.errorContainer}>
        <Text style={screenStyles.errorText}>⚠️ {domainsError}</Text>
        <TouchableOpacity style={screenStyles.retryBtn} onPress={() => router.back()}>
          <Text style={screenStyles.retryBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Empty domains ──
  if (domains.length === 0) {
    return (
      <View style={screenStyles.errorContainer}>
        <Text style={screenStyles.errorText}>⚠️ No check-in domains found</Text>
        <Text style={screenStyles.errorText}>Please contact support if this persists</Text>
        <TouchableOpacity style={screenStyles.retryBtn} onPress={() => router.back()}>
          <Text style={screenStyles.retryBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── No questions in active domain ──
  if (!activeDomain || !activeDomain.questions || activeDomain.questions.length === 0) {
    return (
      <View style={screenStyles.errorContainer}>
        <Text style={screenStyles.errorText}>⚠️ No questions found for this domain</Text>
        <TouchableOpacity style={screenStyles.retryBtn} onPress={() => setActiveDomainIndex(0)}>
          <Text style={screenStyles.retryBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Completion screen ──
  if (submitted) {
    return <CompletionScreen onClose={() => setSubmitted(false)} />;
  }

  return (
    <View style={screenStyles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        ref={scrollRef}
        style={screenStyles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 60 }}
      >
        {/* ── Header ── */}
        <LinearGradient
          colors={['#1A1A2E', '#16213E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={screenStyles.header}
        >
          <View style={screenStyles.headerTop}>
            {/* Back button */}
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              style={screenStyles.backBtn}
            >
              <Text style={screenStyles.backBtnText}>← Back</Text>
            </TouchableOpacity>

            {/* Title */}
            <View style={{ flex: 1 }}>
              <Text style={screenStyles.headerTitle}>Weekly Check-In</Text>
              <Text style={screenStyles.headerSubtitle}>
                Domain {activeDomainIndex + 1} of {totalDomains}
              </Text>
            </View>

            {/* Date badge */}
            <View style={screenStyles.weekBadge}>
              <Text style={screenStyles.weekBadgeText}>
                {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
              </Text>
            </View>
          </View>

          <OverallProgressBar progress={progress} />
        </LinearGradient>

        {/* ── Domain Stepper ── */}
        <View style={screenStyles.stepperWrapper}>
          <DomainStepper
            domains={domains}
            activeDomainIndex={activeDomainIndex}
            values={values}
            onSelect={handleSelectDomain}
          />
        </View>

        {/* ── Active Domain Questions ── */}
        {activeDomain && (
          <DomainPanel
            domain={activeDomain}
            values={values}
            onChange={handleChange}
            onNext={handleNext}
            onPrev={handlePrev}
            isFirst={activeDomainIndex === 0}
            isLast={activeDomainIndex === totalDomains - 1}
            domains={domains}
          />
        )}
      </ScrollView>

      {/* ── Preview & Submit Modal ── */}
      <Modal
        visible={showPreview}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPreview(false)}
      >
        <View style={previewStyles.overlay}>
          <View style={previewStyles.container}>
            <Text style={previewStyles.title}>Review Your Check-In</Text>

            <ScrollView style={{ maxHeight: 400 }}>
              {domains.map((domain) => (
                <View key={domain.id || domain.label} style={previewStyles.domainBlock}>
                  <Text style={[previewStyles.domainTitle, { color: domain.color }]}>
                    {domain.icon} {domain.label}
                  </Text>
                  {(domain.questions || []).map((q) => (
                    <View key={q.id} style={previewStyles.answerRow}>
                      <Text style={previewStyles.question}>{q.label}</Text>
                      <Text style={previewStyles.answer}>
                        {values[q.id] !== null && values[q.id] !== undefined
                          ? values[q.id].toString()
                          : 'Not answered'}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </ScrollView>

            <View style={previewStyles.buttonRow}>
              <TouchableOpacity
                style={previewStyles.editBtn}
                disabled={isSubmitting}
                onPress={() => setShowPreview(false)}
              >
                <Text style={previewStyles.editText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[previewStyles.submitBtn, isSubmitting && { opacity: 0.6 }]}
                disabled={isSubmitting}
                onPress={handleConfirmSubmit}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={previewStyles.submitText}>Confirm Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const screenStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  header: {
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  backBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  backBtnText: { fontSize: 14, fontWeight: '700', color: '#A0AEC0' },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: '#A0AEC0', fontWeight: '500' },
  weekBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.4)',
  },
  weekBadgeText: { fontSize: 13, fontWeight: '700', color: '#667eea' },
  stepperWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    backgroundColor: '#0D0D16',
  },
  scroll: { flex: 1 },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { color: '#94A3B8', fontSize: 16, marginTop: 12, fontWeight: '500' },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#F87171',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#10B981',
    borderRadius: 8,
  },
  retryBtnText: { color: '#FFFFFF', fontWeight: '600' },
});

const previewStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#0D0D16',
    borderRadius: 20,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  domainBlock: { marginBottom: 20 },
  domainTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  answerRow: { marginBottom: 8 },
  question: { fontSize: 13, color: '#9CA3AF', marginBottom: 2 },
  answer: { fontSize: 14, color: '#E5E7EB', fontWeight: '600' },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  editBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
  },
  editText: { color: '#9CA3AF', fontWeight: '600', fontSize: 15 },
  submitBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#667eea',
    alignItems: 'center',
  },
  submitText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});
