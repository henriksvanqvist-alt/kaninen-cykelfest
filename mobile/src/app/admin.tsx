import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useAsyncButton } from '@/lib/hooks/useAsyncButton';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, Pressable, Linking, Modal, ActivityIndicator, Platform,
} from 'react-native';
import { pickImage, pickVideo, pickAudio } from '@/lib/file-picker';
import * as DocumentPicker from 'expo-document-picker';
import { uploadPickedFile } from '@/lib/upload';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api/api';
import { useAppStore } from '@/lib/state/store';
import { ChevronLeft, Bell, Lock, Unlock, ChevronDown, ChevronUp, Pencil } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';

const _UNUSED_NAMES_START = null; // marker
const _UNUSED_NAMES_REMOVE = [
  'Linda Adwall',
  'Linda Ahlgren',
  'Camilla Ahlsson',
  'Ann-Carine Alm',
  'Jenny Andersson Collby',
  'Christina Asciutto',
  'Malin Aspnäs',
  'Caroline Axland',
  'Kajsa Bennbom Lindner',
  'Sofie Bergendahl',
  'Sofia Bergvall',
  'Jenny Bexell',
  'Carolina Björklund',
  'Sara Blomberg',
  'Stina Bohman',
  'Ida Brantefors',
  'Therese Bång',
  'Ywonne Bölja',
  'Katarina Börling',
  'Karin Eckerbom',
  'Marie Eklöf',
  'Jennie Ekstrand',
  'Victoria Enkvist',
  'Ulrika Eriksson',
  'Elsa Erixon',
  'Cecilia Fernholm',
  'Helene Folkunger',
  'Victoria Fröjd',
  'Sara Fäldt',
  'Sabine Gebert Persson',
  'Charlotte Gelin Bornudd',
  'Julia Gomez',
  'Anna Gustafsson',
  'Sara Hansson',
  'Eva Hartman-Juhlin',
  'Jenny Hedberg',
  'Sofia Hedman',
  'Ulrica Hedman',
  'Maria Hellman',
  'Linda Hinners',
  'Anna Hårdstedt',
  'Lisa Illiminsky',
  'Malin Jarvius',
  'Lena Joerö',
  'Lena Jonsson',
  'Emma Julin',
  'Karin Kauppi',
  'Annika Kits',
  'Anette Kravik',
  'Cecilia Krona',
  'Mari Kumilen',
  'Anne Lagerström',
  'Pia Lansåker',
  'Ellen Leijon',
  'Ingela Lennerstrand',
  'Sofia Lernskog',
  'Anna Lidenholm',
  'Lena Liljeström',
  'Kajsa Lindner Bennbom',
  'Marie Linton',
  'Cecilia Lund',
  'Linda Lundberg',
  'Jennifer Lundell',
  'Eva Lundesjö',
  'Regina Löwenhielm',
  'Maria Mani',
  'Nina Martinell',
  'Marie-Louise Mattsson',
  'Deborah McGott',
  'Marie Meurling',
  'Milla Mohr',
  'Helena Nordholm',
  'Sanna Nowinski',
  'Cecilia Olsson',
  'Malin Olsson',
  'Kristina Overend',
  'Eva Penno',
  'Helena Pettersson',
  'Nina Pettersson',
  'Veronica Pettersson',
  'Monika Rahm',
  'Ulrica Riedel',
  'Åsa Rising',
  'Annelie Rydén',
  'Linda Ryttlefors',
  'Marit Schwalbe',
  'Monica Segelsjö',
  'Ellen Stavbom',
  'Christina Stenhammar',
  'Anna Stenkvist',
  'Carina Strandberg',
  'Agneta Stridh Olsson',
  'Yvonne Ström Åkerblom',
  'Camilla Svanqvist',
  'Åsa Svärd',
  'Hanna Söderberg',
  'Fredrik Sörbom',
  'Erika Terao',
  'Mia Thörner Vidinghoff',
  'Anna-Lisa Tiensuu',
  'Camilla Törnberg',
  'Malin Uppströmer Eklöf',
  'Annika Vinnersten',
  'Anna Viring',
  'Johanna Viring Till',
  'Åsa Wallander Wetterqvist',
  'Carolina Wistrand',
  'Lina Åkerblom',
  'Maria Öfverberg Eriksson',
  'Katarina Örnkloo',
  // Herrar
  'Daniel Adwall',
  'Tobias Ahlgren',
  'Fredrik Ahlsson',
  'Sigge Lind',
  'Daniel Andersson Collby',
  'Giuseppe Asciutto',
  'Johan Aspnäs',
  'Oscar Diös',
  'Mathias Lindner',
  'Mattias Hansson',
  'Tomas Bergvall',
  'Marcus Lindholm',
  'Gustaf Björklund',
  'Magnus Blomberg',
  'Peter Bohman',
  'Henrik Åberg',
  'Igor Iszqubel',
  'Daniel Stein',
  'Marcus Börling',
  'Per Eckerbom',
  'Sven-Åke Eklöf',
  'Christofer Ekstrand',
  'Tommy Enkvist',
  'Juppe Carlsson',
  'Per Erixon',
  'LG Lundgren',
  'Johan Folkunger',
  'David Fröjd',
  'Mattias Fäldt',
  'Ronny Persson',
  'Mikael Gelin',
  'Per Johan Blomberg',
  'Anders Gustafsson',
  'Fredrik Hansson',
  'Christopher Juhlin',
  'Andreas Larsson',
  'Anders Hedman',
  'Peter Stenlund',
  'Mats Hellman',
  'Mika Hinners',
  'Markus Haukkala',
  'Michael Illiminsky',
  'Jonas Jarvius',
  'Jörgen Joerö',
  'Jörgen Jonsson',
  'Michell Julin',
  'Arvid Kauppi',
  'Marcus Andersson',
  'Micke Kravik',
  'Niclas Krona',
  'Svante Kumlien',
  'Pär Lansåker',
  'Jörgen Leijon',
  'Johan Lennerstrand',
  'Daniel Årvik',
  'Håkan Lidenholm',
  'Per Liljeström',
  'Mattias Lindner',
  'Hans Linton',
  'Mattias Lund',
  'Johan Lundberg',
  'Thony Lundell',
  'Anders Boström',
  'Fredrik Löwenhielm',
  'Kevin Mani',
  'Magnus Martinell',
  'Per Mattsson',
  'David McGott',
  'Lars Meurling',
  'Matthias Mohr',
  'Paul Nordholm',
  'Daniel Nowinski',
  'Calle Håkansson',
  'Tobias Norström',
  'John Overend',
  'Hendrik Penno',
  'Börje Pettersson',
  'Arne Pettersson',
  'Magnus Rahm',
  'Joakim Riedel',
  'Anna Rising',
  'William Rydén',
  'Mats Ryttlefors',
  'Patrik Schwalbe',
  'Olov Duvernoy',
  'Tomas Stavbom',
  'Johan Stenhammar',
  'Ingemar Eriksson',
  'Ralf Olsson',
  'Jan Åkerblom',
  'Henrik Svanqvist',
  'Björn Hellman',
  'Magnus Söderberg',
  'Camilla Scheinert',
  'Peter Tedeholm',
  'Tomas Vidinghoff',
  'Stefan Tiensuu',
  'Martin Stenport',
  'Mattias Eklöf',
  'Thomas Vinnersten',
  'Anders Viring',
  'Robert Till',
  'Fredrik Wetterqvist',
  'Anders Wistrand',
  'Magnus Åkerblom',
];
// ALL_PARTICIPANT_NAMES is kept as fallback; admin uses allParticipants from DB instead

type HostFormProps = {
  data: { type: string; pin: string; hostNames: string; address: string; meal: string; arrivalTime: string; hostNotes: string; guestInfo: string };
  setData: React.Dispatch<React.SetStateAction<any>>;
  participantNames: string[];
  selectedGuests: string[];
  toggleGuest: (name: string) => void;
  guestSearch: string;
  setGuestSearch: (s: string) => void;
  selectedHosts: string[];
  toggleHost: (name: string) => void;
  hostSearch: string;
  setHostSearch: (s: string) => void;
  onSave: () => void;
  onCancel: () => void;
};

function HostForm({ data, setData, participantNames, selectedGuests, toggleGuest, guestSearch: _gs, setGuestSearch: _sgs, selectedHosts, toggleHost, hostSearch: _hs, setHostSearch: _shs, onSave, onCancel }: HostFormProps) {
  const [guestSearch, setGuestSearch] = React.useState('');
  const [hostSearch, setHostSearch] = React.useState('');
  const filteredGuests = participantNames.filter((n: string) =>
    n.toLowerCase().includes(guestSearch.toLowerCase())
  );
  const filteredHosts = participantNames.filter((n: string) =>
    n.toLowerCase().includes(hostSearch.toLowerCase())
  );
  const showGuestList = guestSearch.length >= 1;
  const showHostList = hostSearch.length >= 1;

  return (
    <View style={{ gap: 10 }}>
      {/* Type selector */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {(['meal', 'task'] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.typeBtn, data.type === t && styles.typeBtnActive]}
            onPress={() => setData((d: any) => ({ ...d, type: t }))}
          >
            <Text style={[styles.typeBtnText, data.type === t && styles.typeBtnTextActive]}>
              {t === 'meal' ? 'Måltid' : 'Uppdrag'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Värdpar-picker */}
      <Text style={styles.formLabel}>VÄRDPAR ({selectedHosts.length} valda)</Text>
      {selectedHosts.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
          {selectedHosts.map(name => (
            <TouchableOpacity
              key={name}
              onPress={() => toggleHost(name)}
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C4F4A', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, gap: 6 }}
            >
              <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: '#fff' }}>{name}</Text>
              <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 16 }}>✕</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <TextInput
        style={styles.formInput}
        placeholder="Addera värdperson..."
        value={hostSearch}
        onChangeText={setHostSearch}
      />
      {showHostList ? (
        <View style={styles.guestPickerList}>
          {filteredHosts.slice(0, 20).map(name => {
            const selected = selectedHosts.includes(name);
            return (
              <TouchableOpacity key={name} onPress={() => toggleHost(name)} style={[styles.guestPickerItem, selected && styles.guestPickerItemSelected]}>
                <Text style={[styles.guestPickerText, selected && styles.guestPickerTextSelected]}>{name}</Text>
                {selected ? <Text style={styles.guestPickerCheck}>✓</Text> : null}
              </TouchableOpacity>
            );
          })}
          {filteredHosts.length > 20 ? <Text style={styles.formLabel}>...och {filteredHosts.length - 20} till</Text> : null}
        </View>
      ) : null}

      {data.type === 'meal' && (
        <>
          <TextInput style={styles.formInput} placeholder="Adress" value={data.address} onChangeText={v => setData((d: any) => ({ ...d, address: v }))} />
          <Text style={styles.formLabel}>MÅLTID</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
            {['Förrätt', 'Varmrätt', 'Efterrätt'].map(option => (
              <TouchableOpacity
                key={option}
                onPress={() => setData((d: any) => ({ ...d, meal: option }))}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: data.meal === option ? '#4A7C59' : '#E8E4DC', borderWidth: data.meal === option ? 0 : 1, borderColor: '#C8C0B0' }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: data.meal === option ? '#fff' : '#5A5040' }}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={styles.formInput} placeholder="Beräknad ankomst (t.ex. 15:30)" value={data.arrivalTime} onChangeText={v => setData((d: any) => ({ ...d, arrivalTime: v }))} />
        </>
      )}
      {data.type === 'task' && (
        <>
          <TextInput style={styles.formInput} placeholder="Uppdragets natur (t.ex. Alkohol)" value={data.meal} onChangeText={v => setData((d: any) => ({ ...d, meal: v }))} />
          <TextInput style={styles.formInput} placeholder="Starttid (t.ex. 14:00)" value={data.arrivalTime} onChangeText={v => setData((d: any) => ({ ...d, arrivalTime: v }))} />
        </>
      )}
      <TextInput style={[styles.formInput, { minHeight: 60 }]} placeholder="Meddelande från kaninen till värdparet" value={data.hostNotes} onChangeText={v => setData((d: any) => ({ ...d, hostNotes: v }))} multiline />

      {/* Gäst-picker */}
      <Text style={styles.formLabel}>GÄSTER ({selectedGuests.length} valda)</Text>
      {selectedGuests.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
          {selectedGuests.map(name => (
            <TouchableOpacity
              key={name}
              onPress={() => toggleGuest(name)}
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#3A5A8A', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, gap: 6 }}
            >
              <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: '#fff' }}>{name}</Text>
              <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 16 }}>✕</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <TextInput
        style={styles.formInput}
        placeholder="Addera gäst..."
        value={guestSearch}
        onChangeText={setGuestSearch}
      />
      {showGuestList ? (
        <View style={styles.guestPickerList}>
          {filteredGuests.slice(0, 20).map(name => {
            const selected = selectedGuests.includes(name);
            return (
              <TouchableOpacity key={name} onPress={() => toggleGuest(name)} style={[styles.guestPickerItem, selected && styles.guestPickerItemSelected]}>
                <Text style={[styles.guestPickerText, selected && styles.guestPickerTextSelected]}>{name}</Text>
                {selected ? <Text style={styles.guestPickerCheck}>✓</Text> : null}
              </TouchableOpacity>
            );
          })}
          {filteredGuests.length > 20 ? <Text style={styles.formLabel}>...och {filteredGuests.length - 20} till</Text> : null}
          {/* Free-text add: show if typed name not already in list or selected */}
          {guestSearch.trim().length >= 1 && !selectedGuests.includes(guestSearch.trim()) && !filteredGuests.map(n => n.toLowerCase()).includes(guestSearch.trim().toLowerCase()) ? (
            <TouchableOpacity
              style={[styles.guestPickerItem, { backgroundColor: '#F0F8F2' }]}
              onPress={() => { toggleGuest(guestSearch.trim()); setGuestSearch(''); }}
            >
              <Text style={[styles.guestPickerText, { color: '#1C4F4A' }]}>+ Lägg till "{guestSearch.trim()}"</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
        <TouchableOpacity style={[styles.adminBtn, { flex: 1 }]} onPress={onSave}>
          <Text style={styles.adminBtnText}>Spara</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.adminBtnSecondary, { flex: 1 }]} onPress={onCancel}>
          <Text style={styles.adminBtnSecondaryText}>Avbryt</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AdminScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const hiddenInputRef = useRef<TextInput>(null);
  const [emergencyMsg, setEmergencyMsg] = useState('');
  const teams = useAppStore((s) => s.teams);
  const settings = useAppStore((s) => s.settings);

  const PIN_LENGTH = 4;
  const ADMIN_PIN = '1234';

  // Nyheter
  type NewsItem = { id: string; title: string; body: string; type: string; createdAt: string };
  type VideoItem = { id: string; title: string; url: string; publishedAt: string };
  const [videoList, setVideoList] = useState<VideoItem[]>([]);
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [addVideoLoading, setAddVideoLoading] = useState(false);
  const [videoFileStatus, setVideoFileStatus] = useState<'idle' | 'compressing' | 'uploading'>('idle');
  const [videoFileProgress, setVideoFileProgress] = useState(0);

  function compressVideoWeb(file: File, onProgress: (pct: number) => void): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);
      video.src = url;
      video.muted = true;
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        const duration = video.duration;
        const stream = (video as any).captureStream();
        const chunks: Blob[] = [];
        const mimeType = (window as any).MediaRecorder?.isTypeSupported?.('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9' : 'video/webm';
        const recorder = new (window as any).MediaRecorder(stream, { mimeType, videoBitsPerSecond: 800_000 });
        recorder.ondataavailable = (e: any) => { if (e.data.size > 0) chunks.push(e.data); };
        recorder.onstop = () => { URL.revokeObjectURL(url); resolve(new Blob(chunks, { type: 'video/webm' })); };
        const interval = setInterval(() => {
          if (duration > 0) onProgress(Math.min(99, Math.round((video.currentTime / duration) * 100)));
        }, 400);
        video.onended = () => { clearInterval(interval); recorder.stop(); };
        recorder.start();
        video.play();
      };
      video.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Kunde inte läsa videon')); };
    });
  }

  async function handlePickVideoFile() {
    if (Platform.OS !== 'web') {
      Alert.alert('Inte tillgängligt', 'Filuppladdning stöds bara i webbläsaren.');
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const LIMIT = 50 * 1024 * 1024; // 50 MB
      const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL!;
      const doUpload = async (blob: Blob, filename: string) => {
        setVideoFileStatus('uploading');
        const form = new FormData();
        form.append('file', blob, filename);
        const res = await fetch(`${BACKEND_URL}/api/upload`, { method: 'POST', body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        setNewVideoUrl(data.data.url);
      };
      try {
        if (file.size <= LIMIT) {
          await doUpload(file, file.name);
        } else {
          setVideoFileStatus('compressing');
          setVideoFileProgress(0);
          const compressed = await compressVideoWeb(file, setVideoFileProgress);
          const fname = file.name.replace(/\.[^.]+$/, '.webm');
          await doUpload(compressed, fname);
        }
      } catch (e: any) {
        Alert.alert('Fel', e?.message ?? 'Något gick fel vid uppladdning.');
      } finally {
        setVideoFileStatus('idle');
        setVideoFileProgress(0);
      }
    };
    input.click();
  }

  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [newsTitle, setNewsTitle] = useState('');
  const [newsBody, setNewsBody] = useState('');
  const [newsType, setNewsType] = useState<'nyhet' | 'viktig' | 'omrostning'>('nyhet');
  const [pollOptions, setPollOptions] = useState(['', '', '', '']);
  const publishNewsBtn = useAsyncButton();
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [editNewsTitle, setEditNewsTitle] = useState('');
  const [editNewsBody, setEditNewsBody] = useState('');

  // Faser (5 stycken)
  type PhaseItem = { id: string; label: string; detail: string | null; orderIndex: number; unlockedAt: string | null };
  const [phaseItems, setPhaseItems] = useState<PhaseItem[]>([]);
  const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null);
  const [editPhaseLabel, setEditPhaseLabel] = useState('');
  const [editPhaseDetail, setEditPhaseDetail] = useState('');

  type Question = { id: string; text: string; answer: string | null; createdAt: string };
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answerInputs, setAnswerInputs] = useState<Record<string, string>>({});
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null);

  type QuizPoll = { id: string; question: string; options: string; orderIndex: number; correctAnswer: number | null; votes: { optionIndex: number }[] };
  const [quizPolls, setQuizPolls] = useState<QuizPoll[]>([]);
  const [editingPollId, setEditingPollId] = useState<string | null>(null);
  const [editPollQuestion, setEditPollQuestion] = useState('');
  const [editPollOptions, setEditPollOptions] = useState(['', '', '', '']);
  const [editPollCorrectAnswer, setEditPollCorrectAnswer] = useState<number>(0);

  // Program stops
  type ProgramStopEdit = { id: string; description: string; rules: string; scoring: string };
  const [programStops, setProgramStops] = useState<ProgramStopEdit[]>([]);
  const [editingStop, setEditingStop] = useState<ProgramStopEdit | null>(null);

  // Leaderboard
  const scores = useAppStore((s) => s.scores);
  const PHASE_LABELS = ['Deltävling 1', 'Deltävling 2', 'Deltävling 3'];
  const PHASE_IDS = ['deltavling-1', 'deltavling-2', 'deltavling-3'];
  // scoreInputs[teamId][phaseIndex] = string value
  const [scoreInputs, setScoreInputs] = useState<Record<string, [string, string, string]>>({});
  const [scoreSaved, setScoreSaved] = useState(false);
  const [scoreLoading, setScoreLoading] = useState(false);

  // Destinations-quiz
  type DQuestion = { id: string; question: string; options: string; correctAnswer: number; orderIndex: number; contentType: string; contentText: string | null; contentUrl: string | null };
  type DQuiz = { id: string; course: string; imageUrl: string | null; questions: DQuestion[] };
  const [destQuizzes, setDestQuizzes] = useState<DQuiz[]>([]);
  const [destQuizzesLoading, setDestQuizzesLoading] = useState(false);

  // New question form per course
  const [newDQCourse, setNewDQCourse] = useState<string | null>(null);
  const [newDQQuestion, setNewDQQuestion] = useState('');
  const [newDQOptions, setNewDQOptions] = useState(['', '', '', '']);
  const [newDQCorrect, setNewDQCorrect] = useState(0);
  const [newDQContentType, setNewDQContentType] = useState<'text' | 'image' | 'video' | 'audio'>('text');
  const [newDQContentText, setNewDQContentText] = useState('');
  const [newDQContentUrl, setNewDQContentUrl] = useState('');

  // Editing existing question
  const [editingDQId, setEditingDQId] = useState<string | null>(null);
  const [editDQQuestion, setEditDQQuestion] = useState('');
  const [editDQOptions, setEditDQOptions] = useState(['', '', '', '']);
  const [editDQCorrect, setEditDQCorrect] = useState(0);
  const [editDQContentType, setEditDQContentType] = useState<'text' | 'image' | 'video' | 'audio'>('text');
  const [editDQContentText, setEditDQContentText] = useState('');
  const [editDQContentUrl, setEditDQContentUrl] = useState('');

  // Image URL per course (editing)
  const [editingImageCourse, setEditingImageCourse] = useState<string | null>(null);
  const [editImageUrl, setEditImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingContentUrl, setUploadingContentUrl] = useState(false);

  const getScoreInput = (teamId: string, pi: number): string => {
    return scoreInputs[teamId]?.[pi] ?? '';
  };
  const setScoreInput = (teamId: string, pi: number, val: string) => {
    setScoreInputs(prev => {
      const cur: [string, string, string] = [...(prev[teamId] ?? ['', '', ''])] as [string, string, string];
      cur[pi] = val.replace(/[^0-9]/g, '');
      return { ...prev, [teamId]: cur };
    });
  };

  // Initialize scoreInputs from existing scores when teams/scores load
  React.useEffect(() => {
    if (teams.length === 0) return;
    const init: Record<string, [string, string, string]> = {};
    teams.forEach(team => {
      const row: [string, string, string] = ['', '', ''];
      PHASE_IDS.forEach((phaseId, pi) => {
        const existing = scores.filter(s => s.teamId === team.id && s.reason === phaseId);
        if (existing.length > 0) {
          row[pi] = String(existing.reduce((a, s) => a + s.points, 0));
        }
      });
      init[team.id] = row;
    });
    setScoreInputs(init);
  }, [teams.length, scores.length]);

  const handleSaveScores = async () => {
    setScoreLoading(true);
    try {
      for (const team of teams) {
        for (let pi = 0; pi < 3; pi++) {
          const val = scoreInputs[team.id]?.[pi] ?? '';
          if (val === '') continue;
          const pts = parseInt(val, 10);
          if (isNaN(pts)) continue;
          // Skicka phaseId: null, använd reason som diskriminator
          await api.post('/api/cykelfest/scores', {
            teamId: team.id,
            phaseId: null,
            points: pts,
            reason: PHASE_IDS[pi], // 'deltavling-1', 'deltavling-2', 'deltavling-3'
          });
        }
      }
      setScoreSaved(true);
      setTimeout(() => setScoreSaved(false), 2500);
    } catch {
      Alert.alert('Fel', 'Kunde inte spara poäng.');
    }
    setScoreLoading(false);
  };

  type HostGuest = { id?: string; participantName: string; dietary: string | null };
  type HostAssignment = {
    id: string; type: string; pin: string; hostNames: string;
    address: string | null; meal: string | null; arrivalTime: string | null;
    hostNotes: string | null; guestInfo: string | null;
    pinSentAt: string | null;
    guests: HostGuest[];
  };
  const [hostAssignments, setHostAssignments] = useState<HostAssignment[]>([]);
  const [editingHostId, setEditingHostId] = useState<string | null>(null);
  const [showNewHostForm, setShowNewHostForm] = useState(false);
  const [hostMealFilter, setHostMealFilter] = useState<string>('Alla');
  const [editHostData, setEditHostData] = useState({
    type: 'meal', pin: '', hostNames: '', address: '', meal: '',
    arrivalTime: '', hostNotes: '', guestInfo: '',
  });
  const [hostGuestSearch, setHostGuestSearch] = useState('');
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  const [hostSearch, setHostSearch] = useState('');
  const [selectedHosts, setSelectedHosts] = useState<string[]>([]);

  // Team assignment state
  type TeamParticipant = { id: string; name: string };
  const [teamAssignData, setTeamAssignData] = useState<Record<string, TeamParticipant[]>>({});
  const [teamAssignLoaded, setTeamAssignLoaded] = useState(false);
  const [teamAddSearch, setTeamAddSearch] = useState<Record<string, string>>({});
  // Maps lowercase team name -> team id (populated after fetch)
  const [teamNameToId, setTeamNameToId] = useState<Record<string, string>>({});

  // Import state
  const [importCsv, setImportCsv] = useState('');
  const [importFile, setImportFile] = useState<{ uri: string; name: string } | null>(null);
  const [importResult, setImportResult] = useState<{ imported: number; errors: string[] } | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Deltagare state
  type ParticipantFull = {
    id: string;
    name: string;
    phone: string | null;
    address: string | null;
    dietary: string | null;
    forratHost: string | null;
    varmrattHost: string | null;
    efterrattHost: string | null;
    mission: string | null;
    role: string;
    team: { name: string } | null;
  };
  const [allParticipants, setAllParticipants] = useState<ParticipantFull[]>([]);
  const [participantSearch, setParticipantSearch] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantFull | null>(null);
  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editDietary, setEditDietary] = useState('');
  const [editMission, setEditMission] = useState('');
  const [savingParticipant, setSavingParticipant] = useState(false);

  // New participant form state
  const [showNewParticipantForm, setShowNewParticipantForm] = useState(false);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [newParticipantPhone, setNewParticipantPhone] = useState('');
  const [newParticipantAddress, setNewParticipantAddress] = useState('');
  const [newParticipantDietary, setNewParticipantDietary] = useState('');
  const [newParticipantForrat, setNewParticipantForrat] = useState('');
  const [newParticipantVarmratt, setNewParticipantVarmratt] = useState('');
  const [newParticipantEfterratt, setNewParticipantEfterratt] = useState('');
  const [mealSearch, setMealSearch] = useState<Record<string, string>>({ forrat: '', varmratt: '', efterratt: '' });


  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [installInforOpen, setInstallInforOpen] = useState(true);
  const [installUnderOpen, setInstallUnderOpen] = useState(false);
  const [installLedtradOpen, setInstallLedtradOpen] = useState(false);
  const [installEfterOpen, setInstallEfterOpen] = useState(false);
  const scrollRef = useRef<any>(null);
  const vardinfoRef = useRef<any>(null);
  const installningarRef = useRef<any>(null);
  function toggleSection(key: string) {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  }
  function scrollToVardinfo() {
    setExpanded(prev => ({ ...prev, vardinfo: true }));
    setTimeout(() => {
      vardinfoRef.current?.measureLayout(
        scrollRef.current?.getInnerViewNode?.() ?? scrollRef.current,
        (_x: number, y: number) => { scrollRef.current?.scrollTo({ y, animated: true }); },
        () => {}
      );
    }, 100);
  }
  function scrollToInstallningar() {
    setExpanded(prev => ({ ...prev, installningar: true }));
    setTimeout(() => {
      installningarRef.current?.measureLayout(
        scrollRef.current?.getInnerViewNode?.() ?? scrollRef.current,
        (_x: number, y: number) => { scrollRef.current?.scrollTo({ y, animated: true }); },
        () => {}
      );
    }, 100);
  }

  // Inställningar — upplåsningsdatum för alla 6 steg
  const [steg1UnlockDate, setSteg1UnlockDate] = useState<Date>(new Date('2026-03-01'));
  const [steg2UnlockDate, setSteg2UnlockDate] = useState<Date>(new Date('2026-03-15'));
  const [lagUnlockDate, setLagUnlockDate] = useState<Date>(new Date('2026-04-20'));
  const [vardinfoUnlockDate, setVardinfoUnlockDate] = useState<Date>(new Date('2026-04-20'));
  const [steg5UnlockDate, setSteg5UnlockDate] = useState<Date>(() => { const d = new Date('2026-05-30'); d.setHours(13, 0, 0, 0); return d; });
  const [steg6UnlockDate, setSteg6UnlockDate] = useState<Date>(() => { const d = new Date('2026-05-30'); d.setHours(15, 30, 0, 0); return d; });
  const [steg7UnlockDate, setSteg7UnlockDate] = useState<Date>(() => { const d = new Date('2026-05-30'); d.setHours(17, 0, 0, 0); return d; });
  const [steg8UnlockDate, setSteg8UnlockDate] = useState<Date>(() => { const d = new Date('2026-05-30'); d.setHours(19, 0, 0, 0); return d; });
  const [aterkopplingUnlockDate, setAterkopplingUnlockDate] = useState<Date>(() => { const d = new Date('2026-05-30'); d.setHours(22, 0, 0, 0); return d; });
  const [ledtradForrattDate, setLedtradForrattDate] = useState<Date>(() => { const d = new Date('2026-05-30'); d.setHours(15, 30, 0, 0); return d; });
  const [ledtradVarmrattDate, setLedtradVarmrattDate] = useState<Date>(() => { const d = new Date('2026-05-30'); d.setHours(18, 15, 0, 0); return d; });
  const [ledtradEfterrattDate, setLedtradEfterrattDate] = useState<Date>(() => { const d = new Date('2026-05-30'); d.setHours(21, 0, 0, 0); return d; });
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Statistik
  type StatsData = {
    deltagare: { totalt: number; bekraftade: number; obekraftade: number; medAllergier: number; medTelefon: number; vardar: number; gaster: number };
    lag: { totalt: number; medDeltagare: number };
    vardskap: { totalt: number; medAdress: number; medGastinfo: number; totalGaster: number };
    fragor: { totalt: number; besvarade: number; obesvarade: number };
    omrostningar: { totalt: number; totalRoster: number };
  };
  const [stats, setStats] = useState<StatsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [importExportOpen, setImportExportOpen] = useState(false);

  async function loadStats() {
    setStatsLoading(true);
    try {
      const data = await api.get<StatsData>('/api/cykelfest/stats');
      setStats(data);
    } catch { /* ignore */ } finally {
      setStatsLoading(false);
    }
  }

  // SOS-inställningar
  const [sosContact1Name, setSosContact1Name] = useState(settings['sos_contact1_name'] ?? '');
  const [sosContact1Number, setSosContact1Number] = useState(settings['sos_contact1_number'] ?? '');
  const [sosContact2Name, setSosContact2Name] = useState(settings['sos_contact2_name'] ?? '');
  const [sosContact2Number, setSosContact2Number] = useState(settings['sos_contact2_number'] ?? '');
  const [sosContact3Name, setSosContact3Name] = useState(settings['sos_contact3_name'] ?? '');
  const [sosContact3Number, setSosContact3Number] = useState(settings['sos_contact3_number'] ?? '');
  const [sosMeetingPoint, setSosMeetingPoint] = useState(settings['sos_meeting_point'] ?? '');
  const [sosSaved, setSosSaved] = useState(false);

  // Återkoppling
  type FeedbackEntry = { id: string; q1: number | null; q2: number | null; q3: number | null; q4: number | null; comment: string | null; submittedAt: string };
  const [feedbackData, setFeedbackData] = useState<FeedbackEntry[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [fbQuestions, setFbQuestions] = useState<{ id: string; position: number; question: string; options: string[] }[]>([]);
  const [fbQuestionsLoading, setFbQuestionsLoading] = useState(false);
  const [fbQuestionsEditing, setFbQuestionsEditing] = useState(false);
  const [fbQuestionsEdit, setFbQuestionsEdit] = useState<{ question: string; options: string[] }[]>([]);
  const [fbQuestionsSaving, setFbQuestionsSaving] = useState(false);

  const fetchFeedback = async () => {
    setFeedbackLoading(true);
    try {
      const data = await api.get<FeedbackEntry[]>('/api/cykelfest/feedback');
      setFeedbackData(data ?? []);
    } catch (e) { console.error('[Admin] fetchFeedback failed:', e); }
    setFeedbackLoading(false);
  };

  const fetchFbQuestions = async () => {
    setFbQuestionsLoading(true);
    try {
      const data = await api.get<{ id: string; position: number; question: string; options: string[] }[]>('/api/cykelfest/feedback/questions');
      setFbQuestions(data ?? []);
    } catch (e) { console.error('[Admin] fetchFbQuestions failed:', e); }
    setFbQuestionsLoading(false);
  };

  const fetchDestQuizzes = async () => {
    setDestQuizzesLoading(true);
    try {
      const data = await api.get<DQuiz[]>('/api/cykelfest/destination-quizzes');
      setDestQuizzes(data);
    } catch {}
    setDestQuizzesLoading(false);
  };

  useEffect(() => {
    if (isLoggedIn) {
      api.get<NewsItem[]>('/api/cykelfest/news').then(setNewsList).catch(() => {});
      api.get<VideoItem[]>('/api/cykelfest/videos').then(data => setVideoList([...data].sort((a,b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()))).catch(() => {});
      api.get<PhaseItem[]>('/api/cykelfest/phases').then(setPhaseItems).catch(() => {});
      api.get<Question[]>('/api/cykelfest/questions').then(setQuestions).catch(() => {});
      api.get<QuizPoll[]>('/api/cykelfest/polls').then((polls) => setQuizPolls(polls.filter(p => p.correctAnswer !== null && p.correctAnswer !== undefined))).catch(() => {});
      api.get<HostAssignment[]>('/api/cykelfest/host-assignments').then(setHostAssignments).catch(() => {});
      api.get<{ id: string; description: string | null; rules: string | null; scoring: string | null }[]>('/api/cykelfest/program-stops').then(data => {
        if (Array.isArray(data)) {
          setProgramStops(data.map(s => ({
            id: s.id,
            description: s.description ?? '',
            rules: s.rules ?? '',
            scoring: s.scoring ?? '',
          })));
        }
      }).catch(() => {});
      api.get<ParticipantFull[]>('/api/cykelfest/participants').then(data => {
        if (Array.isArray(data)) setAllParticipants(data);
      }).catch(() => {});
      api.get<Record<string, string>>('/api/cykelfest/settings').then(s => {
        const parseDate = (v: string) => { const d = new Date(v.length === 10 ? v + 'T00:00:00' : v.length === 16 ? v + ':00' : v); return isNaN(d.getTime()) ? new Date() : d; };
        if (s?.unlock_steg1) setSteg1UnlockDate(parseDate(s.unlock_steg1));
        if (s?.unlock_steg2) setSteg2UnlockDate(parseDate(s.unlock_steg2));
        if (s?.unlock_ditt_lag) setLagUnlockDate(parseDate(s.unlock_ditt_lag));
        if (s?.unlock_vardinfo) setVardinfoUnlockDate(parseDate(s.unlock_vardinfo));
        if (s?.unlock_steg5) setSteg5UnlockDate(parseDate(s.unlock_steg5));
        if (s?.unlock_steg6) setSteg6UnlockDate(parseDate(s.unlock_steg6));
        if (s?.unlock_steg7) setSteg7UnlockDate(parseDate(s.unlock_steg7));
        if (s?.unlock_steg8) setSteg8UnlockDate(parseDate(s.unlock_steg8));
        if (s?.unlock_aterkoppling) setAterkopplingUnlockDate(parseDate(s.unlock_aterkoppling));
        if (s?.unlock_ledtrad_forratt) setLedtradForrattDate(parseDate(s.unlock_ledtrad_forratt));
        if (s?.unlock_ledtrad_varmratt) setLedtradVarmrattDate(parseDate(s.unlock_ledtrad_varmratt));
        if (s?.unlock_ledtrad_efterratt) setLedtradEfterrattDate(parseDate(s.unlock_ledtrad_efterratt));
      }).catch(() => {});
      loadTeamAssignments();
      fetchDestQuizzes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  async function loadTeamAssignments() {
    try {
      const data = await api.get<any[]>('/api/cykelfest/teams');
      const map: Record<string, TeamParticipant[]> = {};
      const nameToId: Record<string, string> = {};
      for (const t of data) {
        map[t.id] = (t.participants ?? []).map((p: any) => ({ id: p.id, name: p.name }));
        nameToId[t.name] = t.id; // store original name as key
      }
      setTeamAssignData(map);
      setTeamNameToId(nameToId);
      setTeamAssignLoaded(true);
    } catch {}
  }

  async function handleImport() {
    if (!importCsv.trim()) return;
    setImportLoading(true);
    setImportResult(null);
    try {
      const delim = importCsv.includes(';') ? ';' : ',';
      const lines = importCsv.trim().split('\n').filter(l => l.trim());
      const dataLines = lines[0]?.toLowerCase().includes('förnamn') || lines[0]?.toLowerCase().includes('fornamn')
        ? lines.slice(1)
        : lines;

      const rows = dataLines.map(line => {
        const cols = line.split(delim).map(c => c.trim().replace(/^"|"$/g, ''));
        return {
          fornamn:      cols[0] ?? '',
          efternamn:    cols[1] ?? '',
          telefon:      cols[2] ?? '',
          lag:          cols[3] ?? '',
          allergier:    cols[4] ?? '',
          vardpar:      cols[5] ?? '',
          maltid:       cols[6] ?? '',
          adress:       cols[7] ?? '',
          ankomsttid:   cols[8] ?? '',
          meddelande:   cols[9] ?? '',
          forratHos:    cols[10] ?? '',
          varmrattHos:  cols[11] ?? '',
          efterrattHos: cols[12] ?? '',
          gastHos:      cols[13] ?? '',
          uppdrag:      cols[14] ?? '',
          bekraftad:    cols[15] ?? '',
        };
      }).filter(r => r.fornamn || r.efternamn);

      const result = await api.post<{ imported: number; errors: string[] }>(
        '/api/cykelfest/import/participants',
        { rows }
      );
      setImportResult(result);
      if (result.imported > 0) {
        await loadTeamAssignments();
        try {
          const data = await api.get<ParticipantFull[]>('/api/cykelfest/participants');
          if (Array.isArray(data)) setAllParticipants(data);
        } catch {}
      }
    } catch (e) {
      setImportResult({ imported: 0, errors: ['Något gick fel vid import.'] });
    } finally {
      setImportLoading(false);
    }
  }

  async function handleImportXlsx() {
    if (!importFile) return;
    setImportLoading(true);
    setImportResult(null);
    try {
      const response = await fetch(importFile.uri);
      const blob = await response.blob();

      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL ?? '';
      const uploadResponse = await fetch(`${backendUrl}/api/cykelfest/import/participants-xlsx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
        body: blob,
      });
      if (!uploadResponse.ok && uploadResponse.headers.get('content-type')?.includes('text/html')) {
        throw new Error(`Serverfel ${uploadResponse.status}`);
      }
      const result = await uploadResponse.json();
      if (result.error) {
        setImportResult({ imported: 0, errors: [result.error.message ?? 'Okänt fel'] });
      } else {
        setImportResult({ imported: result.data?.imported ?? 0, errors: result.data?.errors ?? [] });
        if ((result.data?.imported ?? 0) > 0) {
          setImportFile(null);
        }
      }
    } catch (e: any) {
      setImportResult({ imported: 0, errors: [e?.message ?? 'Nätverksfel'] });
    } finally {
      setImportLoading(false);
    }
  }

  async function handleAddParticipantToTeam(teamId: string, name: string) {
    try {
      const created = await api.post<any>(`/api/cykelfest/teams/${teamId}/participants`, { name });
      setTeamAssignData(prev => ({
        ...prev,
        [teamId]: [...(prev[teamId] ?? []), { id: created.id, name: created.name }],
      }));
      setTeamAddSearch(prev => ({ ...prev, [teamId]: '' }));
    } catch { Alert.alert('Fel', 'Kunde inte lägga till deltagaren.'); }
  }

  async function handleRemoveParticipantFromTeam(teamId: string, participantId: string) {
    try {
      await api.delete(`/api/cykelfest/teams/${teamId}/participants/${participantId}`);
      setTeamAssignData(prev => ({
        ...prev,
        [teamId]: (prev[teamId] ?? []).filter(p => p.id !== participantId),
      }));
    } catch { Alert.alert('Fel', 'Kunde inte ta bort deltagaren.'); }
  }

  const [isCreatingParticipant, setIsCreatingParticipant] = useState(false);

  async function handleSaveParticipant(p: ParticipantFull) {
    setSavingParticipant(true);
    try {
      await api.patch(`/api/cykelfest/participants/${p.id}`, {
        phone: editPhone.trim() || null,
        address: editAddress.trim() || null,
        dietary: editDietary.trim() || null,
        mission: editMission.trim() || null,
      });
      const updated = { ...p, phone: editPhone.trim() || null, address: editAddress.trim() || null, dietary: editDietary.trim() || null, mission: editMission.trim() || null };
      setAllParticipants(prev => prev.map(x => x.id === p.id ? updated : x));
      setSelectedParticipant(updated);
      setEditingParticipantId(null);
    } catch {
      Alert.alert('Fel', 'Kunde inte spara ändringarna.');
    } finally {
      setSavingParticipant(false);
    }
  }

  async function handleCreateParticipant() {
    const name = newParticipantName.trim();
    if (!name) return;
    setIsCreatingParticipant(true);
    try {
      const created = await api.post<ParticipantFull>('/api/cykelfest/participants', { name });
      // Patch with all extra fields in one go
      const patched = await api.patch<ParticipantFull>(`/api/cykelfest/participants/${created.id}`, {
        phone: newParticipantPhone.trim() || null,
        address: newParticipantAddress.trim() || null,
        dietary: newParticipantDietary.trim() || null,
        forratHost: newParticipantForrat.trim() || null,
        varmrattHost: newParticipantVarmratt.trim() || null,
        efterrattHost: newParticipantEfterratt.trim() || null,
      });
      setAllParticipants(prev => [...prev, patched].sort((a, b) => a.name.localeCompare(b.name)));
      setParticipantSearch('');
      setSelectedParticipant(patched);
      setShowNewParticipantForm(false);
      setNewParticipantName(''); setNewParticipantPhone(''); setNewParticipantAddress('');
      setNewParticipantDietary(''); setNewParticipantForrat(''); setNewParticipantVarmratt(''); setNewParticipantEfterratt('');
    } catch {
      Alert.alert('Fel', 'Kunde inte skapa deltagaren.');
    } finally {
      setIsCreatingParticipant(false);
    }
  }

  async function handleCreateTeam(name: string) {
    try {
      const created = await api.post<any>('/api/cykelfest/teams', { name });
      setTeamAssignData(prev => ({ ...prev, [created.id]: [] }));
      setTeamNameToId(prev => ({ ...prev, [name]: created.id }));
    } catch { Alert.alert('Fel', 'Kunde inte skapa laget.'); }
  }

  // --- Nyheter ---
  async function handlePublishNews() {
    if (!newsTitle.trim()) { Alert.alert('Saknar titel', 'Fyll i en titel.'); return; }
    await publishNewsBtn.press(async () => {
      if (newsType === 'omrostning') {
        const validOptions = pollOptions.map(o => o.trim()).filter(Boolean);
        if (validOptions.length < 2) { Alert.alert('Saknar alternativ', 'Fyll i minst 2 svarsalternativ.'); return; }
        try {
          const createdPoll = await api.post<{ id: string }>('/api/cykelfest/polls', { question: newsTitle.trim(), options: validOptions, correctAnswer: null });
          const created = await api.post<NewsItem>('/api/cykelfest/news', { type: newsType, title: newsTitle.trim(), body: newsBody.trim(), pollId: createdPoll.id });
          setNewsList(prev => [created, ...prev]);
          setNewsTitle(''); setNewsBody(''); setNewsType('nyhet'); setPollOptions(['', '', '', '']);
        } catch { Alert.alert('Fel', 'Kunde inte publicera omröstningen.'); }
      } else {
        try {
          const created = await api.post<NewsItem>('/api/cykelfest/news', { type: newsType, title: newsTitle.trim(), body: newsBody.trim() });
          setNewsList(prev => [created, ...prev]);
          setNewsTitle(''); setNewsBody(''); setNewsType('nyhet');
        } catch { Alert.alert('Fel', 'Kunde inte publicera nyheten.'); }
      }
    });
  }

  function startEditNews(item: NewsItem) {
    setEditingNewsId(item.id);
    setEditNewsTitle(item.title);
    setEditNewsBody(item.body);
  }

  async function saveNews(id: string) {
    if (!editNewsTitle.trim()) return;
    try {
      const original = newsList.find(n => n.id === id);
      const updated = await api.put<NewsItem>(`/api/cykelfest/news/${id}`, { title: editNewsTitle.trim(), body: editNewsBody.trim(), type: original?.type ?? 'nyhet' });
      setNewsList(prev => prev.map(n => n.id === id ? updated : n));
      setEditingNewsId(null);
    } catch { Alert.alert('Fel', 'Kunde inte spara nyheten.'); }
  }

  async function deleteNews(id: string) {
    Alert.alert('Ta bort nyhet', 'Är du säker?', [
      { text: 'Avbryt', style: 'cancel' },
      { text: 'Ta bort', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/api/cykelfest/news/${id}`);
          setNewsList(prev => prev.filter(n => n.id !== id));
        } catch { Alert.alert('Fel', 'Kunde inte ta bort nyheten.'); }
      }},
    ]);
  }

  // --- Faser ---
  function startEditPhase(phase: PhaseItem) {
    setEditingPhaseId(phase.id);
    setEditPhaseLabel(phase.label);
    setEditPhaseDetail(phase.detail ?? '');
  }

  async function savePhase(id: string) {
    try {
      const updated = await api.put<PhaseItem>(`/api/cykelfest/phases/${id}`, { label: editPhaseLabel.trim(), detail: editPhaseDetail.trim() });
      setPhaseItems(prev => prev.map(p => p.id === id ? updated : p));
      setEditingPhaseId(null);
    } catch { Alert.alert('Fel', 'Kunde inte spara fasen.'); }
  }

  async function handleUnlockPhase(id: string) {
    try {
      const updated = await api.post<PhaseItem>(`/api/cykelfest/phases/${id}/unlock`, {});
      setPhaseItems(prev => prev.map(p => p.id === id ? updated : p));
    } catch { Alert.alert('Fel', 'Kunde inte aktivera fasen.'); }
  }

  async function handleLockPhase(id: string) {
    try {
      const updated = await api.post<PhaseItem>(`/api/cykelfest/phases/${id}/lock`, {});
      setPhaseItems(prev => prev.map(p => p.id === id ? updated : p));
    } catch { Alert.alert('Fel', 'Kunde inte låsa fasen.'); }
  }

  // --- Quiz ---
  function startEditPoll(poll: QuizPoll) {
    setEditingPollId(poll.id);
    setEditPollQuestion(poll.question);
    const opts = JSON.parse(poll.options) as string[];
    setEditPollOptions([opts[0] ?? '', opts[1] ?? '', opts[2] ?? '', opts[3] ?? '']);
    setEditPollCorrectAnswer(poll.correctAnswer ?? 0);
  }

  async function savePoll(poll: QuizPoll) {
    if (!editPollQuestion.trim()) return;
    try {
      const updated = await api.put<QuizPoll>(`/api/cykelfest/polls/${poll.id}`, {
        question: editPollQuestion.trim(),
        options: editPollOptions.map(o => o.trim()),
        orderIndex: poll.orderIndex,
        correctAnswer: editPollCorrectAnswer,
      });
      setQuizPolls(prev => prev.map(p => p.id === poll.id ? updated : p));
      setEditingPollId(null);
    } catch { Alert.alert('Fel', 'Kunde inte spara frågan.'); }
  }

  // --- Program stops ---
  async function saveStop() {
    if (!editingStop) return;
    try {
      await api.put(`/api/cykelfest/program-stops/${editingStop.id}`, {
        description: editingStop.description,
        rules: editingStop.rules,
        scoring: editingStop.scoring,
      });
      setProgramStops(prev => prev.map(s => s.id === editingStop.id ? editingStop : s));
      setEditingStop(null);
    } catch { Alert.alert('Fel', 'Kunde inte spara aktiviteten.'); }
  }

  // --- Frågor ---
  async function handleAnswer(id: string) {
    const answer = (answerInputs[id] ?? '').trim();
    if (!answer) return;
    try {
      const updated = await api.post<Question>(`/api/cykelfest/questions/${id}/answer`, { answer, answeredBy: 'Tävlingsledningen' });
      setQuestions(prev => prev.map(q => q.id === id ? updated : q));
      setAnswerInputs(prev => ({ ...prev, [id]: '' }));
      setEditingAnswerId(null);
    } catch { Alert.alert('Fel', 'Kunde inte spara svaret.'); }
  }

  async function deleteQuestion(id: string) {
    Alert.alert('Ta bort fråga', 'Är du säker? Frågan och svaret tas bort.', [
      { text: 'Avbryt', style: 'cancel' },
      { text: 'Ta bort', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/api/cykelfest/questions/${id}`);
          setQuestions(prev => prev.filter(q => q.id !== id));
        } catch { Alert.alert('Fel', 'Kunde inte ta bort frågan.'); }
      }},
    ]);
  }

  // --- Mitt värdskap ---
  function startEditHost(a: HostAssignment) {
    setEditingHostId(a.id);
    setEditHostData({
      type: a.type, pin: a.pin, hostNames: a.hostNames,
      address: a.address ?? '', meal: a.meal ?? '',
      arrivalTime: a.arrivalTime ?? '', hostNotes: a.hostNotes ?? '',
      guestInfo: a.guestInfo ?? '',
    });
    setSelectedGuests(a.guests.map(g => g.participantName));
    setSelectedHosts(a.hostNames ? a.hostNames.split(' & ').map(n => n.trim()).filter(Boolean) : []);
    setHostGuestSearch('');
    setHostSearch('');
    setShowNewHostForm(false);
  }

  function startNewHost() {
    setEditingHostId(null);
    setShowNewHostForm(true);
    setEditHostData({ type: 'meal', pin: '', hostNames: '', address: '', meal: '', arrivalTime: '', hostNotes: '', guestInfo: '' });
    setSelectedGuests([]);
    setSelectedHosts([]);
    setHostGuestSearch('');
    setHostSearch('');
  }

  async function saveHost() {
    const hostNames = selectedHosts.join(' & ');
    if (!hostNames.trim()) {
      Alert.alert('Saknar info', 'Värdpar krävs.'); return;
    }
    try {
      let saved: HostAssignment;
      const payload = { ...editHostData, hostNames };
      if (editingHostId) {
        saved = await api.put<HostAssignment>(`/api/cykelfest/host-assignments/${editingHostId}`, payload);
      } else {
        saved = await api.post<HostAssignment>('/api/cykelfest/host-assignments', payload);
      }
      const updated = await api.put<HostAssignment>(`/api/cykelfest/host-assignments/${saved.id}/guests`, {
        guests: selectedGuests.map(name => ({ participantName: name, dietary: null })),
      });
      if (editingHostId) {
        setHostAssignments(prev => prev.map(a => a.id === editingHostId ? updated : a));
      } else {
        setHostAssignments(prev => [...prev, updated]);
      }
      setEditingHostId(null);
      setShowNewHostForm(false);
    } catch (e: any) {
      Alert.alert('Fel', e?.message ?? 'Kunde inte spara.');
    }
  }

  async function deleteHost(id: string) {
    Alert.alert('Ta bort värdskap', 'Är du säker?', [
      { text: 'Avbryt', style: 'cancel' },
      { text: 'Ta bort', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/api/cykelfest/host-assignments/${id}`);
          setHostAssignments(prev => prev.filter(a => a.id !== id));
          if (editingHostId === id) { setEditingHostId(null); }
        } catch { Alert.alert('Fel', 'Kunde inte ta bort.'); }
      }},
    ]);
  }

  function toggleGuest(name: string) {
    setSelectedGuests(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  }

  function toggleHost(name: string) {
    setSelectedHosts(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  }

  // --- Nödmeddelande ---
  function handleLogin() {
    if (code === ADMIN_PIN) {
      setPinError(false);
      setIsLoggedIn(true);
    } else {
      setPinError(true);
      setCode('');
      setTimeout(() => setPinError(false), 1500);
    }
  }

  function handlePinChange(text: string) {
    const digits = text.replace(/[^0-9]/g, '').slice(0, PIN_LENGTH);
    setCode(digits);
    setPinError(false);
  }

  useEffect(() => {
    if (code.length === PIN_LENGTH) handleLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  async function handleEmergency() {
    if (!emergencyMsg.trim()) { Alert.alert('Saknar meddelande', 'Skriv ett nödmeddelande.'); return; }
    Alert.alert('Skicka nödmeddelande', 'Detta skickas till ALLA deltagare omedelbart.', [
      { text: 'Avbryt', style: 'cancel' },
      { text: 'Skicka', style: 'destructive', onPress: async () => {
        try {
          const created = await api.post<NewsItem>('/api/cykelfest/news', { type: 'viktig', title: emergencyMsg, body: emergencyMsg });
          setNewsList(prev => [created, ...prev]);
          setEmergencyMsg('');
          Alert.alert('Skickat', 'Nödmeddelandet är nu live.');
        } catch { Alert.alert('Fel', 'Kunde inte skicka.'); }
      }},
    ]);
  }

  const filteredParticipants = useMemo(() => {
    const toLastFirst = (name: string) => {
      const parts = name.trim().split(/\s+/);
      if (parts.length < 2) return name;
      const last = parts[parts.length - 1];
      const first = parts.slice(0, parts.length - 1).join(' ');
      return `${last} ${first}`;
    };
    const sorted = participantSearch.trim().length > 0
      ? allParticipants.filter(p => p.name.toLowerCase().includes(participantSearch.toLowerCase()))
      : [...allParticipants];
    return sorted
      .map(p => ({ ...p, displayName: toLastFirst(p.name) }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName, 'sv'));
  }, [participantSearch, allParticipants]);

  if (!isLoggedIn) {
    return (
      <View style={styles.container} testID="admin-login-screen">
        <LinearGradient colors={['#1C1C2E', '#2A1C4A']} style={styles.loginHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} testID="back-btn">
            <ChevronLeft size={22} color="#A4A4F4" />
          </TouchableOpacity>
          <Text style={styles.loginEyebrow}>RESTRICTED ACCESS</Text>
          <Text style={styles.loginTitle}>Kontrollrum</Text>
          <Text style={styles.loginSub}>Ange din 4-siffriga kod</Text>
        </LinearGradient>

        <View style={styles.loginContent}>
          <View style={styles.loginCard}>
            <Text style={styles.loginLabel}>PIN-KOD</Text>

            <TextInput
              ref={hiddenInputRef}
              style={styles.hiddenInput}
              value={code}
              onChangeText={handlePinChange}
              keyboardType="number-pad"
              maxLength={PIN_LENGTH}
              autoFocus
              caretHidden
              testID="admin-pin-input"
            />

            <Pressable style={styles.pinRow} onPress={() => hiddenInputRef.current?.focus()} testID="pin-boxes">
              {Array.from({ length: PIN_LENGTH }).map((_, i) => {
                const filled = i < code.length;
                const active = i === code.length && !pinError;
                return (
                  <View
                    key={i}
                    style={[
                      styles.pinBox,
                      filled && styles.pinBoxFilled,
                      active && styles.pinBoxActive,
                      pinError && styles.pinBoxError,
                    ]}
                  >
                    <Text style={[styles.pinDigit, pinError && styles.pinDigitError]}>
                      {filled ? code[i] : ''}
                    </Text>
                  </View>
                );
              })}
            </Pressable>

            {pinError ? (
              <Text style={styles.errorText}>Fel PIN-kod. Försök igen.</Text>
            ) : null}

            <TouchableOpacity
              style={[styles.loginBtn, code.length < PIN_LENGTH && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={code.length < PIN_LENGTH}
              testID="admin-login-btn"
            >
              <LinearGradient
                colors={code.length < PIN_LENGTH ? ['#8A7A7A', '#6A5A5A'] : ['#4A1C1C', '#8B1A1A']}
                style={styles.loginBtnGrad}
              >
                <Text style={styles.loginBtnText}>Logga in</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const ADMIN_TEAMS: { name: string; emoji: string }[] = [
    { name: 'Charter',          emoji: '✈️' },
    { name: 'Safari',           emoji: '🦁' },
    { name: 'Fjällvandring',    emoji: '⛰️' },
    { name: 'Tågluff',          emoji: '🚂' },
    { name: 'Camping',          emoji: '⛺' },
    { name: 'Träningsresa',     emoji: '🏋️' },
    { name: 'Backpacking',      emoji: '🎒' },
    { name: 'Kryssning',        emoji: '🚢' },
    { name: 'Alpresa',          emoji: '🎿' },
    { name: 'Club 33',          emoji: '🍹' },
  ];

  // fetchedTeams: list of { id, name } for teams that exist in the db
  // Built from teamNameToId which is populated by loadTeamAssignments
  const fetchedTeams: { id: string; name: string }[] = Object.entries(teamNameToId).map(
    ([name, id]) => ({ id, name })
  );

  return (
    <ScrollView ref={scrollRef} style={styles.container} contentContainerStyle={styles.content} testID="admin-panel-screen">
      <LinearGradient colors={['#1C1C2E', '#2A1C4A']} style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            const anyOpen = Object.values(expanded).some(Boolean);
            if (anyOpen) {
              setExpanded({});
            } else {
              router.back();
            }
          }}
          style={styles.backBtn}
          testID="admin-back-btn"
        >
          <ChevronLeft size={22} color="#A8D4B8" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kontrollrum</Text>
        <Text style={styles.headerSub}>Kaninens Cykelfest 2026</Text>
        <TouchableOpacity
          onPress={() => Linking.openURL(`${process.env.EXPO_PUBLIC_BACKEND_URL}/manual`)}
          style={{ marginTop: 12, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(168,212,184,0.12)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(168,212,184,0.25)' }}
        >
          <Text style={{ fontFamily: 'SpaceMono_400Regular', fontSize: 10, color: '#A8D4B8', letterSpacing: 1 }}>📖  ÖPPNA MANUAL</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* ===== SECTION DIVIDER: INFÖR CYKELFESTEN ===== */}
      <View style={styles.groupDividerInfor}>
        <Text style={styles.groupDividerLabel}>INFÖR CYKELFESTEN</Text>
        <Text style={styles.groupDividerSub}>Förberedelser inför festen</Text>
      </View>

      {/* DELTAGARE */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('deltagare')}>
          <View style={styles.accordionLabelWrap}>
            <Text style={styles.accordionLabel}>DELTAGARE ({allParticipants.length} deltagare)</Text>
            <Text style={styles.accordionSub}>Visa och hantera anmälda deltagare</Text>
          </View>
          {expanded['deltagare'] ? <ChevronUp size={16} color="#9A8E78" /> : <ChevronDown size={16} color="#9A8E78" />}
        </TouchableOpacity>
        {expanded['deltagare'] ? (
          <View style={{ gap: 10 }}>

            {/* Import-knapp flyttad till Import och export av data */}

            {/* 1) Sökfält */}
            <TextInput
              style={styles.formInput}
              placeholder="Sök deltagare..."
              placeholderTextColor="#B8B0A0"
              value={participantSearch}
              onChangeText={(t) => { setParticipantSearch(t); }}
              testID="participant-search-input"
            />

            {/* 3) Bokstavsordnad lista med expanderbara rader */}
            {filteredParticipants.length > 0 ? (
              <View style={styles.guestPickerList}>
                {filteredParticipants
                  .map(p => {
                  const isSelected = selectedParticipant?.id === p.id;
                  const isVard = p.role === 'host';
                  const isEditing = editingParticipantId === p.id;
                  return (
                    <View key={p.id}>
                      <TouchableOpacity
                        style={styles.guestPickerItem}
                        onPress={() => {
                          setSelectedParticipant(prev => prev?.id === p.id ? null : p);
                          setEditingParticipantId(null);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.guestPickerText, isSelected && styles.guestPickerTextSelected]}>{p.displayName}</Text>
                        {isSelected
                          ? <ChevronUp size={16} color="#9A8E78" />
                          : <ChevronDown size={16} color="#9A8E78" />}
                      </TouchableOpacity>

                      {/* Expanderat detaljinnehåll */}
                      {isSelected ? (
                        <View style={{ backgroundColor: '#fff', marginHorizontal: 0, marginBottom: 2, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E8E0CC', paddingHorizontal: 16, paddingVertical: 14, gap: 10 }}>

                          {/* Basinfo — visnings- eller redigeringsläge */}
                          {(() => {
                            const hostAssignment = hostAssignments.find(a =>
                              a.hostNames?.toLowerCase().includes(p.name?.toLowerCase() ?? '')
                            );
                            const coHost = hostAssignment?.hostNames
                              ? hostAssignment.hostNames.split('&').map((n: string) => n.trim()).find((n: string) => n.toLowerCase() !== p.name.toLowerCase()) ?? null
                              : null;

                            if (isEditing) {
                              return (
                                <View style={{ gap: 10 }}>
                                  {[
                                    { label: 'ADRESS', value: editAddress, setter: setEditAddress, keyboard: 'default' as const, multiline: false },
                                    { label: 'TELEFON', value: editPhone, setter: setEditPhone, keyboard: 'phone-pad' as const, multiline: false },
                                    { label: 'ALLERGIER', value: editDietary, setter: setEditDietary, keyboard: 'default' as const, multiline: false },
                                    { label: 'UPPDRAG', value: editMission, setter: setEditMission, keyboard: 'default' as const, multiline: true },
                                  ].map(row => (
                                    <View key={row.label} style={{ gap: 3 }}>
                                      <Text style={styles.formLabel}>{row.label}</Text>
                                      <TextInput
                                        style={[styles.formInput, { marginBottom: 0 }, row.multiline && { height: 64, textAlignVertical: 'top' }]}
                                        value={row.value}
                                        onChangeText={row.setter}
                                        keyboardType={row.keyboard}
                                        placeholder="–"
                                        placeholderTextColor="#C0B8A8"
                                        multiline={row.multiline}
                                      />
                                    </View>
                                  ))}
                                  <View style={{ alignItems: 'flex-end', marginTop: 4 }}>
                                    <TouchableOpacity
                                      style={[styles.publishBtn, { opacity: savingParticipant ? 0.6 : 1, paddingHorizontal: 24 }]}
                                      onPress={() => handleSaveParticipant(p)}
                                      disabled={savingParticipant}
                                    >
                                      <Text style={styles.publishBtnText}>{savingParticipant ? 'Sparar…' : 'Spara'}</Text>
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              );
                            }

                            return (
                              <View style={{ gap: 6 }}>
                                {[
                                  { label: 'LAG', value: p.team?.name ?? '–' },
                                  { label: 'ADRESS', value: p.address ?? '–' },
                                  { label: 'TELEFON', value: p.phone ?? '–' },
                                  { label: 'ALLERGIER', value: p.dietary ?? '–' },
                                  ...(coHost ? [{ label: 'VÄRDPAR', value: coHost }] : []),
                                ].map(row => (
                                  <View key={row.label} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                                    <Text style={[styles.formLabel, { minWidth: 80, marginTop: 1 }]}>{row.label}</Text>
                                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: '#2A2A2A', flex: 1 }}>{row.value}</Text>
                                  </View>
                                ))}
                              </View>
                            );
                          })()}

                          {/* Måltider — dold i redigeringsläge */}
                          {!isEditing ? (
                            <View style={{ gap: 5 }}>
                              <Text style={styles.formLabel}>MÅLTIDER</Text>
                              {[
                                { maltid: 'Förrätt', host: p.forratHost },
                                { maltid: 'Varmrätt', host: p.varmrattHost },
                                { maltid: 'Efterrätt', host: p.efterrattHost },
                              ].map(({ maltid, host }) => {
                                // Check if this person is a host for this specific meal
                                const isVardMal = hostAssignments.some(a =>
                                  a.meal === maltid &&
                                  a.hostNames?.toLowerCase().includes(p.name?.toLowerCase() ?? '')
                                );
                                const roll = isVardMal ? 'VÄRD' : host ? 'GÄST' : null;
                                const lookupName = isVardMal ? p.name : host ?? null;
                                const assignment = hostAssignments.find(a =>
                                  a.meal === maltid && lookupName &&
                                  a.hostNames?.toLowerCase().includes(lookupName.toLowerCase())
                                );
                                const address = assignment?.address ?? null;
                                const hostPairName = assignment?.hostNames ?? (isVardMal ? p.name : host) ?? null;
                                const bgColor = isVardMal ? '#EAF5EA' : host ? '#EAF0FF' : '#F8F5EE';
                                const accentColor = isVardMal ? '#2A6A3A' : host ? '#1A3A6B' : '#C0B8A8';
                                const textColor = isVardMal ? '#1A4A2A' : host ? '#0F2A5A' : '#B0A898';
                                return (
                                  <View key={maltid} style={{ backgroundColor: bgColor, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: accentColor, paddingHorizontal: 12, paddingVertical: 9, gap: 3 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                      <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 12, color: textColor }}>{maltid}</Text>
                                      {roll ? (
                                        <View style={{ backgroundColor: accentColor, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                                          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 9, color: '#fff', letterSpacing: 0.5 }}>{roll}</Text>
                                        </View>
                                      ) : (
                                        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: '#C0B8A8' }}>–</Text>
                                      )}
                                    </View>
                                    {hostPairName && roll ? (
                                      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: textColor, opacity: 0.85 }}>
                                        {isVardMal ? 'Värdpar: ' : 'Hos: '}{hostPairName}
                                      </Text>
                                    ) : null}
                                    {roll ? (
                                      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: textColor, opacity: 0.65 }}>
                                        {address ?? '–'}
                                      </Text>
                                    ) : null}
                                  </View>
                                );
                              })}
                            </View>
                          ) : null}

                          {/* Uppdrag — dold i redigeringsläge */}
                          {!isEditing && p.mission && p.mission.trim() !== '' && p.mission.trim() !== '0' ? (
                            <View style={{ gap: 5 }}>
                              <Text style={styles.formLabel}>UPPDRAG</Text>
                              <View style={{ backgroundColor: '#FFF8EC', borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#E8A020', paddingHorizontal: 12, paddingVertical: 10 }}>
                                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: '#5A3800', lineHeight: 19 }}>{p.mission}</Text>
                              </View>
                            </View>
                          ) : null}

                          {/* Redigera-knapp */}
                          {!isEditing ? (
                            <TouchableOpacity
                              style={[styles.quizEditBtn, { alignSelf: 'flex-end', marginTop: 4, backgroundColor: '#FFF0F0' }]}
                              onPress={() => {
                                setEditingParticipantId(p.id);
                                setEditPhone(p.phone ?? '');
                                setEditAddress(p.address ?? '');
                                setEditDietary(p.dietary ?? '');
                                setEditMission((p.mission && p.mission.trim() !== '0') ? p.mission : '');
                              }}
                            >
                              <Text style={[styles.quizEditBtnText, { color: '#C0392B' }]}>Redigera</Text>
                            </TouchableOpacity>
                          ) : null}

                          {/* PIN-kod värdpar */}
                          {!isEditing && (() => {
                            const ha = hostAssignments.find(a =>
                              a.hostNames?.toLowerCase().includes(p.name?.toLowerCase() ?? '')
                            );
                            if (!ha?.pin) return null;
                            const sentAt = ha.pinSentAt ? new Date(ha.pinSentAt) : null;
                            const sentLabel = sentAt
                              ? `Skickad ${sentAt.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })} kl. ${sentAt.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}`
                              : null;
                            return (
                              <View style={{ backgroundColor: '#C0392B', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, gap: 10, marginTop: 2 }}>
                                <View style={{ gap: 2 }}>
                                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 10, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.8, textTransform: 'uppercase' }}>Pinkod värdskap</Text>
                                  <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 26, color: '#fff', letterSpacing: 3 }}>{ha.pin}</Text>
                                  {sentLabel ? (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
                                      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.85)' }}>✓ Pinkod skickad</Text>
                                      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>· {sentLabel}</Text>
                                    </View>
                                  ) : null}
                                </View>
                                <TouchableOpacity
                                  style={{ backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 8, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }}
                                  onPress={() => {
                                    Alert.alert(
                                      'Skicka pinkod till värd',
                                      `Skicka PIN-kod ${ha.pin} till ${p.name}?\n\nSMS skickas till ${p.phone ?? 'okänt nummer'}.`,
                                      [
                                        { text: 'Avbryt', style: 'cancel' },
                                        { text: 'Skicka', style: 'default', onPress: async () => {
                                          try {
                                            const res = await api.post<{ sent: { name: string; phone: string; status: string }[]; pinSentAt?: string }>(`/api/cykelfest/host-assignments/${ha.id}/send-pin-sms`, {});
                                            const sent = res?.sent ?? [];
                                            if (sent.length === 0) {
                                              Alert.alert('Inget skickat', 'Inget telefonnummer hittades för denna värd.');
                                            } else {
                                              // Update local state with sent timestamp
                                              if (res?.pinSentAt) {
                                                setHostAssignments(prev => prev.map(a => a.id === ha.id ? { ...a, pinSentAt: res.pinSentAt ?? null } : a));
                                              }
                                              Alert.alert('SMS skickat!', sent.map(s => `${s.name}: ${s.status}`).join('\n'));
                                            }
                                          } catch (e: any) {
                                            Alert.alert('Fel', e?.message ?? 'Kunde inte skicka SMS. Kontrollera att ELKS_API_USERNAME och ELKS_API_PASSWORD är satta i ENV-fliken.');
                                          }
                                        }},
                                      ]
                                    );
                                  }}
                                >
                                  <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 13, color: '#fff', letterSpacing: 0.3 }}>Skicka pinkod till värd</Text>
                                </TouchableOpacity>
                              </View>
                            );
                          })()}

                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            ) : participantSearch.trim().length > 0 ? (
              <View style={{ gap: 8 }}>
                <Text style={styles.emptyText}>Inga deltagare matchar.</Text>
                {participantSearch.trim().length >= 2 && !showNewParticipantForm ? (
                  <TouchableOpacity
                    style={[styles.addBtn, { backgroundColor: '#1C4F4A' }]}
                    onPress={() => {
                      setNewParticipantName(participantSearch.trim());
                      setShowNewParticipantForm(true);
                    }}
                  >
                    <Text style={styles.addBtnText}>{`+ Skapa "${participantSearch.trim()}" som ny deltagare`}</Text>
                  </TouchableOpacity>
                ) : null}
                {showNewParticipantForm ? (
                  <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 14, gap: 10, borderWidth: 1, borderColor: '#E8E0CC' }}>
                    <Text style={[styles.formLabel, { fontSize: 13, marginBottom: 2 }]}>NY DELTAGARE</Text>
                    {[
                      { label: 'NAMN', value: newParticipantName, setter: setNewParticipantName, keyboard: 'default' as const },
                      { label: 'TELEFON', value: newParticipantPhone, setter: setNewParticipantPhone, keyboard: 'phone-pad' as const },
                      { label: 'ADRESS', value: newParticipantAddress, setter: setNewParticipantAddress, keyboard: 'default' as const },
                      { label: 'ALLERGIER', value: newParticipantDietary, setter: setNewParticipantDietary, keyboard: 'default' as const },
                    ].map(row => (
                      <View key={row.label} style={{ gap: 3 }}>
                        <Text style={styles.formLabel}>{row.label}</Text>
                        <TextInput
                          style={[styles.formInput, { marginBottom: 0 }]}
                          value={row.value}
                          onChangeText={row.setter}
                          keyboardType={row.keyboard}
                          placeholder="–"
                          placeholderTextColor="#C0B8A8"
                        />
                      </View>
                    ))}
                    <Text style={[styles.formLabel, { marginTop: 4 }]}>MÅLTIDER</Text>
                    {([
                      { key: 'forrat', label: 'FÖRRÄTT HOS', meal: 'Förrätt', value: newParticipantForrat, setter: setNewParticipantForrat },
                      { key: 'varmratt', label: 'VARMRÄTT HOS', meal: 'Varmrätt', value: newParticipantVarmratt, setter: setNewParticipantVarmratt },
                      { key: 'efterratt', label: 'EFTERRÄTT HOS', meal: 'Efterrätt', value: newParticipantEfterratt, setter: setNewParticipantEfterratt },
                    ] as { key: string; label: string; meal: string; value: string; setter: (v: string) => void }[]).map(row => {
                      const hostsForMeal = hostAssignments.filter(a => a.meal === row.meal).map(a => a.hostNames);
                      const search = mealSearch[row.key] ?? '';
                      const filtered = hostsForMeal.filter(n => n.toLowerCase().includes(search.toLowerCase()));
                      const isOpen = search.length > 0 && !row.value;
                      return (
                        <View key={row.key} style={{ gap: 3 }}>
                          <Text style={styles.formLabel}>{row.label}</Text>
                          {row.value ? (
                            <TouchableOpacity
                              style={{ backgroundColor: '#EAF5EA', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 11, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                              onPress={() => { row.setter(''); setMealSearch(prev => ({ ...prev, [row.key]: '' })); }}
                            >
                              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: '#1A4A2A', flex: 1 }}>{row.value}</Text>
                              <Text style={{ color: '#9A8E78', fontSize: 16, marginLeft: 8 }}>✕</Text>
                            </TouchableOpacity>
                          ) : (
                            <View>
                              <TextInput
                                style={[styles.formInput, { marginBottom: 0 }]}
                                value={search}
                                onChangeText={t => setMealSearch(prev => ({ ...prev, [row.key]: t }))}
                                placeholder="Sök värdpar..."
                                placeholderTextColor="#C0B8A8"
                              />
                              {isOpen && filtered.length > 0 ? (
                                <View style={{ backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#E8E0CC', marginTop: 2, maxHeight: 160, overflow: 'hidden' }}>
                                  {filtered.map(name => (
                                    <TouchableOpacity
                                      key={name}
                                      style={{ paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F0EAD6' }}
                                      onPress={() => { row.setter(name); setMealSearch(prev => ({ ...prev, [row.key]: '' })); }}
                                    >
                                      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: '#2A2A2A' }}>{name}</Text>
                                    </TouchableOpacity>
                                  ))}
                                </View>
                              ) : isOpen && filtered.length === 0 ? (
                                <Text style={[styles.emptyText, { marginTop: 4 }]}>Inga värdpar matchar.</Text>
                              ) : null}
                            </View>
                          )}
                        </View>
                      );
                    })}
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                      <TouchableOpacity
                        style={[styles.addBtn, { flex: 1, backgroundColor: '#9A8E78' }]}
                        onPress={() => { setShowNewParticipantForm(false); setNewParticipantName(''); setNewParticipantPhone(''); setNewParticipantAddress(''); setNewParticipantDietary(''); setNewParticipantForrat(''); setNewParticipantVarmratt(''); setNewParticipantEfterratt(''); }}
                      >
                        <Text style={styles.addBtnText}>Avbryt</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.addBtn, { flex: 2, backgroundColor: '#1C4F4A', opacity: isCreatingParticipant ? 0.6 : 1 }]}
                        disabled={isCreatingParticipant || !newParticipantName.trim()}
                        onPress={() => handleCreateParticipant()}
                      >
                        <Text style={styles.addBtnText}>{isCreatingParticipant ? 'Skapar...' : 'Skapa deltagare'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}
              </View>
            ) : null}

            {/* 4) Vald deltagare — borttagen, nu inline ovan */}
          </View>
        ) : null}
      </View>

      {/* VIDEOS */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('videos')}>
          <View style={styles.accordionLabelWrap}>
            <Text style={styles.accordionLabel}>VIDEOS ({videoList.length} st)</Text>
            <Text style={styles.accordionSub}>Lägg till och ta bort videos på startsidan</Text>
          </View>
          {expanded['videos'] ? <ChevronUp size={16} color="#9A8E78" /> : <ChevronDown size={16} color="#9A8E78" />}
        </TouchableOpacity>
        {expanded['videos'] ? (
          <View style={{ gap: 10 }}>
            <View style={[styles.card, { gap: 8 }]}>
              <Text style={styles.phaseLabel}>Lägg till video</Text>
              <TextInput
                style={styles.input}
                value={newVideoTitle}
                onChangeText={setNewVideoTitle}
                placeholder="Titel (t.ex. Kaninen dansar)…"
                placeholderTextColor="#B8B0A0"
              />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  value={newVideoUrl}
                  onChangeText={setNewVideoUrl}
                  placeholder="Video-URL (MP4 eller stream-länk)…"
                  placeholderTextColor="#B8B0A0"
                  autoCapitalize="none"
                  keyboardType="url"
                />
                <TouchableOpacity
                  onPress={handlePickVideoFile}
                  disabled={videoFileStatus !== 'idle'}
                  style={{ backgroundColor: '#EAE4D4', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, opacity: videoFileStatus !== 'idle' ? 0.5 : 1 }}
                >
                  <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 12, color: '#5A3800' }}>Välj fil</Text>
                </TouchableOpacity>
              </View>
              {videoFileStatus !== 'idle' ? (
                <View style={{ backgroundColor: '#F5F1E8', borderRadius: 8, padding: 10, gap: 6 }}>
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#5A3800' }}>
                    {videoFileStatus === 'compressing' ? `Komprimerar… ${videoFileProgress}%` : 'Laddar upp…'}
                  </Text>
                  <View style={{ height: 4, backgroundColor: '#EDE6D6', borderRadius: 2, overflow: 'hidden' }}>
                    <View style={{ height: 4, backgroundColor: '#2A6B64', borderRadius: 2, width: videoFileStatus === 'uploading' ? '100%' : `${videoFileProgress}%` as any }} />
                  </View>
                </View>
              ) : null}
              <TouchableOpacity
                style={[styles.publishBtn, (!newVideoTitle.trim() || !newVideoUrl.trim() || addVideoLoading || videoFileStatus !== 'idle') && { opacity: 0.5 }]}
                disabled={!newVideoTitle.trim() || !newVideoUrl.trim() || addVideoLoading || videoFileStatus !== 'idle'}
                onPress={async () => {
                  setAddVideoLoading(true);
                  try {
                    const created = await api.post<VideoItem>('/api/cykelfest/videos', { title: newVideoTitle.trim(), url: newVideoUrl.trim() });
                    setVideoList(prev => [created, ...prev]);
                    setNewVideoTitle('');
                    setNewVideoUrl('');
                  } catch { Alert.alert('Fel', 'Kunde inte lägga till videon.'); }
                  setAddVideoLoading(false);
                }}
              >
                <Text style={styles.publishBtnText}>{addVideoLoading ? 'Lägger till…' : 'Lägg till'}</Text>
              </TouchableOpacity>
            </View>
            {videoList.length > 0 ? (
              <View style={styles.card}>
                {videoList.map((v, i) => (
                  <View key={v.id}>
                    {i > 0 && <View style={styles.phaseDivider} />}
                    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: '#2A2A2A' }}>{v.title}</Text>
                        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: '#9A8E78', marginTop: 2 }} numberOfLines={1}>{v.url}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={async () => {
                          try {
                            await api.delete(`/api/cykelfest/videos/${v.id}`);
                            setVideoList(prev => prev.filter(x => x.id !== v.id));
                          } catch { Alert.alert('Fel', 'Kunde inte ta bort videon.'); }
                        }}
                        style={{ padding: 6 }}
                      >
                        <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 12, color: '#C0392B' }}>Ta bort</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      {/* FRÅN KANINEN — nyheter */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('nyheter')}>
          <View style={styles.accordionLabelWrap}>
            <Text style={styles.accordionLabel}>MEDDELANDEN ({newsList.length} stycken)</Text>
            <Text style={styles.accordionSub}>Skicka nyheter och uppdateringar till deltagare</Text>
          </View>
          {expanded['nyheter'] ? <ChevronUp size={16} color="#9A8E78" /> : <ChevronDown size={16} color="#9A8E78" />}
        </TouchableOpacity>
        {expanded['nyheter'] ? (
          <View>
            <View style={[styles.card, { marginBottom: 10 }]}>
              <Text style={styles.phaseLabel}>Publicera ny nyhet</Text>
              <TextInput
                style={styles.input}
                value={newsTitle}
                onChangeText={setNewsTitle}
                placeholder="Titel…"
                placeholderTextColor="#B8B0A0"
                testID="news-title-input"
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newsBody}
                onChangeText={setNewsBody}
                placeholder="Brödtext (valfritt)…"
                placeholderTextColor="#B8B0A0"
                multiline
                numberOfLines={3}
                testID="news-body-input"
              />
              <Text style={[styles.phaseLabel, { marginTop: 4 }]}>TYP</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {([
                  { value: 'nyhet', label: 'Nyhet' },
                  { value: 'viktig', label: 'Viktig' },
                  { value: 'omrostning', label: 'Omröstning' },
                ] as const).map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setNewsType(opt.value)}
                    style={[
                      styles.typeBtn,
                      newsType === opt.value && styles.typeBtnActive,
                    ]}
                  >
                    <Text style={[styles.typeBtnText, newsType === opt.value && styles.typeBtnTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {newsType === 'omrostning' && (
                <View style={{ gap: 6 }}>
                  <Text style={[styles.phaseLabel, { marginTop: 4 }]}>SVARSALTERNATIV</Text>
                  {pollOptions.map((opt, i) => (
                    <TextInput
                      key={i}
                      style={styles.input}
                      value={opt}
                      onChangeText={t => setPollOptions(prev => prev.map((o, idx) => idx === i ? t : o))}
                      placeholder={`Alternativ ${i + 1}${i < 2 ? ' (obligatoriskt)' : ' (valfritt)'}…`}
                      placeholderTextColor="#B8B0A0"
                    />
                  ))}
                </View>
              )}
              <TouchableOpacity style={[styles.publishBtn, publishNewsBtn.loading && { opacity: 0.6 }]} onPress={handlePublishNews} disabled={publishNewsBtn.loading} testID="publish-news-btn">
                <Text style={styles.publishBtnText}>{publishNewsBtn.loading ? 'Publicerar…' : 'Publicera'}</Text>
              </TouchableOpacity>
            </View>
            {newsList.length > 0 && (
              <View style={styles.card}>
                {newsList.map((item, i) => (
                  <View key={item.id}>
                    {i > 0 && <View style={styles.phaseDivider} />}
                    {editingNewsId === item.id ? (
                      <View style={{ padding: 14, gap: 8 }}>
                        <TextInput
                          style={styles.input}
                          value={editNewsTitle}
                          onChangeText={setEditNewsTitle}
                          placeholder="Titel…"
                          placeholderTextColor="#B8B0A0"
                        />
                        <TextInput
                          style={[styles.input, styles.textArea]}
                          value={editNewsBody}
                          onChangeText={setEditNewsBody}
                          placeholder="Brödtext…"
                          placeholderTextColor="#B8B0A0"
                          multiline
                          numberOfLines={4}
                        />
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <TouchableOpacity style={[styles.publishBtn, { flex: 1 }]} onPress={() => saveNews(item.id)}>
                            <Text style={styles.publishBtnText}>Spara</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.adminBtnSecondary, { flex: 1 }]} onPress={() => setEditingNewsId(null)}>
                            <Text style={styles.adminBtnSecondaryText}>Avbryt</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <View style={{ padding: 14, gap: 8 }}>
                        <TouchableOpacity
                          onPress={() => toggleSection(`news_${item.id}`)}
                          style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}
                        >
                          <View style={{ flex: 1, gap: 4 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={{
                                fontSize: 10,
                                fontFamily: 'DMSans_600SemiBold',
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 4,
                                overflow: 'hidden',
                                ...(item.type === 'viktig'
                                  ? { backgroundColor: '#FFF0D0', color: '#9A6800' }
                                  : item.type === 'omrostning'
                                  ? { backgroundColor: '#E8E0FF', color: '#5040A0' }
                                  : { backgroundColor: '#E0F0E8', color: '#1C4F4A' }),
                              }}>
                                {item.type === 'viktig' ? '⚠ Viktig' : item.type === 'omrostning' ? '◉ Omröstning' : '● Nyhet'}
                              </Text>
                            </View>
                            <Text style={styles.phaseLabel}>{item.title}</Text>
                          </View>
                          {expanded[`news_${item.id}`] ? <ChevronUp size={18} color="#9A8E78" /> : <ChevronDown size={18} color="#9A8E78" />}
                        </TouchableOpacity>
                        {!!expanded[`news_${item.id}`] && (
                          <View style={{ gap: 8 }}>
                            {item.body ? <Text style={styles.phaseDesc}>{item.body}</Text> : null}
                            <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
                              <TouchableOpacity style={styles.quizEditBtn} onPress={() => startEditNews(item)}>
                                <Text style={styles.quizEditBtnText}>Redigera</Text>
                              </TouchableOpacity>
                              <TouchableOpacity style={[styles.quizEditBtn, { backgroundColor: '#FFF0F0' }]} onPress={() => deleteNews(item.id)}>
                                <Text style={[styles.quizEditBtnText, { color: '#C0392B' }]}>Ta bort</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : null}
      </View>

      {/* VAD HÄNDER HÄRNÄST — sex steg */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('faser')}>
          <View style={styles.accordionLabelWrap}>
            <Text style={styles.accordionLabel}>VAD HÄNDER HÄRNÄST (6 steg)</Text>
            <Text style={styles.accordionSub}>Steg och milstolpar inför festen</Text>
          </View>
          {expanded['faser'] ? <ChevronUp size={16} color="#9A8E78" /> : <ChevronDown size={16} color="#9A8E78" />}
        </TouchableOpacity>
        {expanded['faser'] ? (
          <View style={{ gap: 10, paddingHorizontal: 4 }}>
            {[
              { label: 'Intresseanmälan',  settingKey: 'unlock_steg1', sub: 'Personer som anmält intresse', emoji: '✋', colors: ['#D4A017', '#A07810'] },
              { label: 'Bekräfta anmälan', settingKey: 'unlock_steg2', sub: 'Bekräftelse av deltagande',     emoji: '✅', colors: ['#1E8449', '#145A32'] },
              { label: 'Mitt lag',         settingKey: 'unlock_ditt_lag', sub: 'Lagindelning och laginfo',  emoji: '🚴', colors: ['#2471A3', '#1A5276'] },
              { label: 'Mitt värdskap',    settingKey: 'unlock_vardinfo', sub: 'Värdskapsinfo och gästlista', emoji: '🏡', colors: ['#CA6F1E', '#A04000'] },
              { label: 'Adress & info',    settingKey: 'unlock_steg5', sub: 'Adress till förrätten & klädsel', emoji: '📍', colors: ['#7D3C98', '#5B2C6F'] },
              { label: 'Kaninens Cykelfest', settingKey: 'unlock_steg6', sub: 'Startskottet — dags att cykla!', emoji: '🐰', colors: ['#C0392B', '#922B21'] },
            ].map((steg, i) => {
              const val = settings[steg.settingKey];
              const todayStr = new Date().toISOString().slice(0, 10);
              const isUnlocked = val ? todayStr >= val.slice(0, 10) : false;
              let dateLabel = '—';
              if (val) {
                const d = new Date(val.length === 10 ? val + 'T00:00:00' : val);
                if (!isNaN(d.getTime())) {
                  dateLabel = d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
                }
              }
              return (
                <View key={steg.settingKey} style={{
                  flexDirection: 'row',
                  backgroundColor: '#fff',
                  borderRadius: 10,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: '#EDE6D6',
                }}>
                  {/* Colored left accent bar */}
                  <View style={{ width: 3, backgroundColor: isUnlocked ? steg.colors[0] : '#D8D0C0' }} />
                  {/* Card content */}
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 10 }}>
                    {/* Step number */}
                    <Text style={{ fontFamily: 'SpaceMono_400Regular', fontSize: 9, color: isUnlocked ? steg.colors[0] : '#9A8E78', width: 36 }}>STEG {i + 1}</Text>
                    {/* Title + sub */}
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: isUnlocked ? '#2A2A2A' : '#6A6055' }}>{steg.label}</Text>
                      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: '#9A8E78', marginTop: 1 }}>{steg.sub}</Text>
                      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 10, color: isUnlocked ? steg.colors[0] : '#B0A898', marginTop: 2 }}>
                        {isUnlocked ? `Öppnade ${dateLabel}` : `Öppnar ${dateLabel}`}
                      </Text>
                    </View>
                    {/* Status chip */}
                    <View style={{
                      backgroundColor: isUnlocked ? steg.colors[0] + '22' : '#F0EBE0',
                      borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4,
                      borderWidth: 1,
                      borderColor: isUnlocked ? steg.colors[0] + '55' : '#DDD5C5',
                    }}>
                      <Text style={{ fontFamily: 'SpaceMono_400Regular', fontSize: 9, color: isUnlocked ? steg.colors[0] : '#9A8E78' }}>
                        {isUnlocked ? 'ÖPPEN' : 'LÅST'}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6, backgroundColor: '#F5F0E8', borderRadius: 10, padding: 10 }}>
              <Text style={[styles.phaseDesc, { flex: 1, color: '#6A6055' }]}>Datumen ändras under</Text>
              <TouchableOpacity onPress={() => { scrollToInstallningar(); }}>
                <Text style={[styles.phaseDesc, { color: '#1C4F4A', fontFamily: 'DMSans_600SemiBold', textDecorationLine: 'underline' }]}>Upplåsningsdatum ↓</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </View>

      {/* Lag-status */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('lag')}>
          <View style={styles.accordionLabelWrap}>
            <Text style={styles.accordionLabel}>MITT LAG ({teams.length} lag)</Text>
            <Text style={styles.accordionSub}>Lagindelning och tilldelning av deltagare</Text>
          </View>
          {expanded['lag'] ? <ChevronUp size={16} color="#9A8E78" /> : <ChevronDown size={16} color="#9A8E78" />}
        </TouchableOpacity>
        {expanded['lag'] ? (
          <View style={{ gap: 8 }}>
            {ADMIN_TEAMS.map((teamDef) => {
              const fetchedTeam = fetchedTeams.find(
                ft => ft.name.toLowerCase() === teamDef.name.toLowerCase()
              );
              const participants = fetchedTeam ? (teamAssignData[fetchedTeam.id] ?? []) : [];
              const isExpanded = !!expanded[`lag_${teamDef.name}`];
              const search = teamAddSearch[teamDef.name] ?? '';
              const showSearch = search.length >= 2;
              const alreadyAssigned = new Set(participants.map(p => p.name));
              const filteredNames = allParticipants.map((p: { name: string }) => p.name).filter(
                (n: string) => n.toLowerCase().includes(search.toLowerCase()) && !alreadyAssigned.has(n)
              );

              return (
                <View key={teamDef.name} style={styles.adminCard}>
                  <TouchableOpacity
                    style={styles.accordionHeader}
                    onPress={async () => {
                      if (!fetchedTeam) await handleCreateTeam(teamDef.name);
                      toggleSection(`lag_${teamDef.name}`);
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                      <Text style={{ fontSize: 20 }}>{teamDef.emoji}</Text>
                      <Text style={styles.accordionLabel}>{teamDef.name}</Text>
                      <View style={styles.teamCountBadge}>
                        <Text style={styles.teamCountText}>{participants.length}</Text>
                      </View>
                    </View>
                    {isExpanded ? <ChevronUp size={16} color="#9A8E78" /> : <ChevronDown size={16} color="#9A8E78" />}
                  </TouchableOpacity>

                  {isExpanded ? (
                    <View style={{ gap: 6, paddingTop: 4 }}>
                      {/* Assigned participants */}
                      {participants.length === 0 ? (
                        <Text style={styles.emptyText}>Inga deltagare tilldelade ännu.</Text>
                      ) : (
                        participants.map(p => (
                          <View key={p.id} style={styles.participantRow}>
                            <Text style={styles.participantName}>{p.name}</Text>
                            <TouchableOpacity
                              onPress={() => handleRemoveParticipantFromTeam(fetchedTeam?.id ?? '', p.id)}
                              style={styles.removeBtn}
                              testID={`remove-participant-${p.id}`}
                            >
                              <Text style={styles.removeBtnText}>✕</Text>
                            </TouchableOpacity>
                          </View>
                        ))
                      )}

                      {/* Search to add participant */}
                      <View style={{ marginTop: 6 }}>
                        <TextInput
                          style={styles.formInput}
                          placeholder="Sök och lägg till deltagare..."
                          placeholderTextColor="#B8B0A0"
                          value={search}
                          onChangeText={t => setTeamAddSearch(prev => ({ ...prev, [teamDef.name]: t }))}
                          testID={`team-search-${teamDef.name}`}
                        />
                      </View>
                      {showSearch ? (
                        <View style={styles.guestPickerList}>
                          {filteredNames.slice(0, 20).map(name => (
                            <TouchableOpacity
                              key={name}
                              style={styles.guestPickerItem}
                              onPress={() => handleAddParticipantToTeam(fetchedTeam?.id ?? '', name)}
                            >
                              <Text style={styles.guestPickerText}>{name}</Text>
                              <Text style={{ color: '#1C4F4A', fontSize: 16 }}>+</Text>
                            </TouchableOpacity>
                          ))}
                          {filteredNames.length === 0 ? (
                            <View style={{ padding: 10 }}>
                              <Text style={styles.emptyText}>Inga matchande namn.</Text>
                            </View>
                          ) : null}
                          {filteredNames.length > 20 ? (
                            <View style={{ padding: 10 }}>
                              <Text style={styles.formLabel}>...och {filteredNames.length - 20} till</Text>
                            </View>
                          ) : null}
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              );
            })}
            {!teamAssignLoaded ? (
              <Text style={styles.emptyText}>Laddar lag...</Text>
            ) : null}
          </View>
        ) : null}
      </View>

      {/* ===== MITT VÄRDSKAP ===== */}
      <View ref={vardinfoRef} style={styles.section}>
        <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('vardinfo')}>
          <View style={styles.accordionLabelWrap}>
            <Text style={styles.accordionLabel}>MITT VÄRDSKAP ({hostAssignments.length} värdpar)</Text>
            <Text style={styles.accordionSub}>Värdpar, gäster och placeringar</Text>
          </View>
          {expanded['vardinfo'] ? <ChevronUp size={16} color="#9A8E78" /> : <ChevronDown size={16} color="#9A8E78" />}
        </TouchableOpacity>
        {expanded['vardinfo'] ? (
          <View>
            <TouchableOpacity style={[styles.addBtn, { backgroundColor: '#1C4F4A' }]} onPress={startNewHost}>
              <Text style={styles.addBtnText}>+ Lägg till nytt värdskap</Text>
            </TouchableOpacity>

            {/* Översikt — alla värdpar */}
            {hostAssignments.length > 0 && (
              <View style={styles.card}>
                {/* Filterknappar */}
                <View style={{ flexDirection: 'row', padding: 12, paddingBottom: 10, gap: 6 }}>
                  {['Alla', 'Förrätt', 'Varmrätt', 'Efterrätt'].map(f => (
                    <TouchableOpacity
                      key={f}
                      onPress={() => setHostMealFilter(f)}
                      style={{ flex: 1, alignItems: 'center', paddingVertical: 7, borderRadius: 8, backgroundColor: hostMealFilter === f ? '#1C4F4A' : '#F0EBE0' }}
                    >
                      <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 12, color: hostMealFilter === f ? '#fff' : '#6A6055' }}>{f}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.phaseDivider} />
                {[...hostAssignments]
                  .filter(a => hostMealFilter === 'Alla' || a.meal === hostMealFilter)
                  .sort((a, b) => {
                    const order: Record<string, number> = { 'Förrätt': 0, 'Varmrätt': 1, 'Efterrätt': 2 };
                    return (order[a.meal ?? ''] ?? 99) - (order[b.meal ?? ''] ?? 99);
                  }).map((a, i) => (
                  <View key={a.id}>
                    {i > 0 && <View style={styles.phaseDivider} />}
                    {editingHostId === a.id ? (
                      <View style={{ padding: 4 }}>
                        <HostForm
                          data={editHostData} setData={setEditHostData}
                          participantNames={allParticipants.map(p => p.name)}
                          selectedGuests={selectedGuests} toggleGuest={toggleGuest}
                          guestSearch={hostGuestSearch} setGuestSearch={setHostGuestSearch}
                          selectedHosts={selectedHosts} toggleHost={toggleHost}
                          hostSearch={hostSearch} setHostSearch={setHostSearch}
                          onSave={saveHost} onCancel={() => setEditingHostId(null)}
                        />
                      </View>
                    ) : (
                      <View style={{ paddingVertical: 10 }}>
                        <TouchableOpacity
                          onPress={() => toggleSection(`host_${a.id}`)}
                          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={styles.hostCardName}>{a.hostNames}</Text>
                            <Text style={styles.hostCardMeta}>
                              {(() => { const n = a.hostNames ? a.hostNames.split(/\s*(?:&| och )\s*/).filter(Boolean).length : 0; return `${a.type === 'meal' ? a.meal : 'Uppdrag'} · ${a.guests.length} gäster + ${n} ${n === 1 ? 'värd' : 'värdar'}`; })()}
                            </Text>
                          </View>
                          {expanded[`host_${a.id}`] ? <ChevronUp size={18} color="#9A8E78" /> : <ChevronDown size={18} color="#9A8E78" />}
                        </TouchableOpacity>
                        {expanded[`host_${a.id}`] ? (
                          <View style={{ marginTop: 8, gap: 6 }}>
                            {/* Plats & tid */}
                            {(a.address || a.meal || a.arrivalTime) ? (
                              <View style={{ backgroundColor: '#F0F5F0', borderRadius: 8, padding: 10 }}>
                                <Text style={styles.formLabel}>PLATS & TID</Text>
                                {a.meal ? <Text style={[styles.hostGuestList, { marginBottom: 2 }]}>Måltid: {a.meal}</Text> : null}
                                {a.address
                                  ? <Text style={[styles.hostGuestList, { marginBottom: 2 }]}>Adress: {a.address}</Text>
                                  : <Text style={[styles.hostGuestList, { marginBottom: 2, color: '#C0392B', fontFamily: 'DMSans_600SemiBold' }]}>⚠ Adress saknas — lägg till innan lansering</Text>
                                }
                                {a.arrivalTime ? <Text style={[styles.hostGuestList, { marginBottom: 0 }]}>Ankomst: {a.arrivalTime}</Text> : null}
                              </View>
                            ) : null}
                            {/* Gäster */}
                            {a.guests.length > 0 && (
                              <View style={{ backgroundColor: '#F5F1E8', borderRadius: 8, padding: 10 }}>
                                <Text style={styles.formLabel}>GÄSTER ({a.guests.length})</Text>
                                {a.guests.map(g => (
                                  <Text key={g.id ?? g.participantName} style={[styles.hostGuestList, { marginBottom: 2 }]}>
                                    {g.participantName}{g.dietary ? ` · ${g.dietary}` : ''}
                                  </Text>
                                ))}
                              </View>
                            )}
                            {/* Meddelande från kaninen */}
                            <View style={{ backgroundColor: '#EAF0FF', borderRadius: 8, padding: 10 }}>
                              <Text style={styles.formLabel}>MEDDELANDE FRÅN KANINEN</Text>
                              <Text style={[styles.hostGuestList, { marginBottom: 0 }]}>{a.hostNotes || '–'}</Text>
                            </View>
                            {/* PIN */}
                            <View style={{ backgroundColor: '#F5F0F5', borderRadius: 8, padding: 10 }}>
                              <Text style={styles.formLabel}>PIN-KOD (auto-genererad)</Text>
                              <Text style={[styles.hostGuestList, { marginBottom: 0, fontFamily: 'SpaceMono_400Regular', letterSpacing: 4 }]}>{a.pin || '–'}</Text>
                            </View>
                            {/* Åtgärdsknappar */}
                            <View style={{ gap: 6, marginTop: 12 }}>
                              {/* SMS — hel bredd */}
                              <TouchableOpacity
                                style={{ backgroundColor: '#D6EDD9', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center' }}
                                onPress={() => {
                                  Alert.alert(
                                    'Skicka PIN via SMS',
                                    `Skicka PIN-kod ${a.pin} till ${a.hostNames}?\n\nSMS skickas till det telefonnummer som angetts vid anmälan.`,
                                    [
                                      { text: 'Avbryt', style: 'cancel' },
                                      { text: 'Skicka', style: 'default', onPress: async () => {
                                        try {
                                          const res = await api.post<{ sent: { name: string; phone: string; status: string }[] }>(`/api/cykelfest/host-assignments/${a.id}/send-pin-sms`, {});
                                          const sent = res?.sent ?? [];
                                          if (sent.length === 0) {
                                            Alert.alert('Inget skickat', 'Inga telefonnummer hittades för värdparet.');
                                          } else {
                                            Alert.alert('SMS skickat!', sent.map(s => `${s.name}: ${s.status}`).join('\n'));
                                          }
                                        } catch (e: any) {
                                          Alert.alert('Fel', e?.message ?? 'Kunde inte skicka SMS. Kontrollera att ELKS_API_USERNAME och ELKS_API_PASSWORD är satta i ENV-fliken.');
                                        }
                                      }},
                                    ]
                                  );
                                }}
                              >
                                <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: '#1A5C2A' }}>Skicka PIN via SMS</Text>
                              </TouchableOpacity>
                              {/* Redigera + Ta bort på samma rad */}
                              <View style={{ flexDirection: 'row', gap: 8 }}>
                                <TouchableOpacity onPress={() => startEditHost(a)} style={[styles.editBtn, { flex: 1, alignItems: 'center' }]}>
                                  <Text style={styles.editBtnText}>Redigera</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => deleteHost(a.id)} style={[styles.deleteBtn, { flex: 1, alignItems: 'center', marginTop: 0 }]}>
                                  <Text style={styles.deleteBtnText}>Ta bort</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          </View>
                        ) : null}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {showNewHostForm ? (
              <View style={styles.adminCard}>
                <HostForm
                  data={editHostData} setData={setEditHostData}
                  participantNames={allParticipants.map(p => p.name)}
                  selectedGuests={selectedGuests} toggleGuest={toggleGuest}
                  guestSearch={hostGuestSearch} setGuestSearch={setHostGuestSearch}
                  selectedHosts={selectedHosts} toggleHost={toggleHost}
                  hostSearch={hostSearch} setHostSearch={setHostSearch}
                  onSave={saveHost} onCancel={() => setShowNewHostForm(false)}
                />
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      {/* QUIZ */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('quiz')}>
          <View style={styles.accordionLabelWrap}>
            <Text style={styles.accordionLabel}>QUIZ ({quizPolls.length} frågor)</Text>
            <Text style={styles.accordionSub}>Hantera omröstningar och frågor</Text>
          </View>
          {expanded['quiz'] ? <ChevronUp size={16} color="#9A8E78" /> : <ChevronDown size={16} color="#9A8E78" />}
        </TouchableOpacity>
        {expanded['quiz'] ? (
          <View style={styles.card}>
            {quizPolls.length === 0 ? (
              <Text style={styles.emptyText}>Inga frågor ännu.</Text>
            ) : (
              quizPolls.map((poll, i) => (
                <View key={poll.id}>
                  {i > 0 && <View style={styles.phaseDivider} />}
                  <View style={styles.quizPollItem}>
                    {editingPollId === poll.id ? (
                      <View style={styles.quizEditForm}>
                        <TextInput
                          style={[styles.input, styles.textArea, { minHeight: 100 }]}
                          value={editPollQuestion}
                          onChangeText={setEditPollQuestion}
                          placeholder="Frågan…"
                          placeholderTextColor="#B8B0A0"
                          multiline
                          numberOfLines={4}
                        />
                        {editPollOptions.map((opt, oi) => (
                          <TextInput
                            key={oi}
                            style={styles.input}
                            value={opt}
                            onChangeText={(t) => setEditPollOptions(prev => prev.map((o, idx) => idx === oi ? t : o))}
                            placeholder={`Alternativ ${oi + 1}…`}
                            placeholderTextColor="#B8B0A0"
                          />
                        ))}
                        <Text style={styles.correctAnswerLabel}>RÄTT SVAR</Text>
                        <View style={styles.correctAnswerRow}>
                          {['A', 'B', 'C', 'D'].map((letter, oi) => (
                            <TouchableOpacity
                              key={oi}
                              style={[styles.correctAnswerBtn, editPollCorrectAnswer === oi && styles.correctAnswerBtnActive]}
                              onPress={() => setEditPollCorrectAnswer(oi)}
                            >
                              <Text style={[styles.correctAnswerBtnText, editPollCorrectAnswer === oi && styles.correctAnswerBtnTextActive]}>{letter}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <TouchableOpacity style={[styles.publishBtn, { flex: 1 }]} onPress={() => savePoll(poll)}>
                            <Text style={styles.publishBtnText}>Spara</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.adminBtnSecondary, { flex: 1 }]} onPress={() => { setEditingPollId(null); toggleSection(`quiz_${poll.id}`); }}>
                            <Text style={styles.adminBtnSecondaryText}>Avbryt</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <View style={{ gap: 6 }}>
                        <TouchableOpacity
                          onPress={() => toggleSection(`quiz_${poll.id}`)}
                          style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}
                        >
                          <Text style={styles.quizPollIndex}>{poll.orderIndex}</Text>
                          <Text style={[styles.quizPollQuestion, { flex: 1 }]}>{poll.question}</Text>
                          {expanded[`quiz_${poll.id}`] ? <ChevronUp size={18} color="#9A8E78" style={{ marginTop: 1 }} /> : <ChevronDown size={18} color="#9A8E78" style={{ marginTop: 1 }} />}
                        </TouchableOpacity>
                        {!!expanded[`quiz_${poll.id}`] && (
                          <View style={{ gap: 8, marginTop: 4 }}>
                            <TextInput
                              style={[styles.input, styles.textArea, { minHeight: 80 }]}
                              value={editingPollId === poll.id ? editPollQuestion : poll.question}
                              onChangeText={(t) => { if (editingPollId !== poll.id) startEditPoll(poll); setEditPollQuestion(t); }}
                              multiline
                              numberOfLines={3}
                            />
                            {(editingPollId === poll.id ? editPollOptions : (JSON.parse(poll.options) as string[])).map((opt: string, oi: number) => (
                              <TextInput
                                key={oi}
                                style={styles.input}
                                value={opt}
                                onChangeText={(t) => { if (editingPollId !== poll.id) startEditPoll(poll); setEditPollOptions(prev => prev.map((o, idx) => idx === oi ? t : o)); }}
                                placeholder={`Alternativ ${oi + 1}…`}
                                placeholderTextColor="#B8B0A0"
                              />
                            ))}
                            <Text style={styles.correctAnswerLabel}>RÄTT SVAR</Text>
                            <View style={styles.correctAnswerRow}>
                              {['A', 'B', 'C', 'D'].map((letter, oi) => {
                                const active = editingPollId === poll.id ? editPollCorrectAnswer === oi : poll.correctAnswer === oi;
                                return (
                                  <TouchableOpacity
                                    key={oi}
                                    style={[styles.correctAnswerBtn, active && styles.correctAnswerBtnActive]}
                                    onPress={() => { if (editingPollId !== poll.id) startEditPoll(poll); setEditPollCorrectAnswer(oi); }}
                                  >
                                    <Text style={[styles.correctAnswerBtnText, active && styles.correctAnswerBtnTextActive]}>{letter}</Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                            <TouchableOpacity style={styles.publishBtn} onPress={() => savePoll(poll)}>
                              <Text style={styles.publishBtnText}>Spara</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        ) : null}
      </View>

      {/* Frågor från deltagare / Fråga kaninen */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('fragakaninen')}>
          <View style={styles.accordionLabelWrap}>
            <Text style={styles.accordionLabel}>FRÅGOR OCH SVAR ({questions.length} frågor)</Text>
            <Text style={styles.accordionSub}>Se och hantera frågor skickade av deltagare</Text>
          </View>
          {expanded['fragakaninen'] ? <ChevronUp size={16} color="#9A8E78" /> : <ChevronDown size={16} color="#9A8E78" />}
        </TouchableOpacity>
        {expanded['fragakaninen'] ? (
          questions.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.emptyText}>Inga frågor ännu.</Text>
            </View>
          ) : (
            <View style={styles.card}>
              {questions.map((q, i) => (
                <View key={q.id}>
                  {i > 0 && <View style={styles.phaseDivider} />}
                  <View style={styles.questionAdminItem}>
                    {/* Klickbar rubrikrad med chevron */}
                    <TouchableOpacity
                      onPress={() => toggleSection(`frage_${q.id}`)}
                      style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}
                    >
                      <Text style={[styles.questionAdminText, { flex: 1 }]}>{q.text}</Text>
                      {expanded[`frage_${q.id}`] ? <ChevronUp size={18} color="#9A8E78" /> : <ChevronDown size={18} color="#9A8E78" />}
                    </TouchableOpacity>
                    {/* Expanderat innehåll */}
                    {!!expanded[`frage_${q.id}`] && (
                      <View style={{ marginTop: 8, gap: 8 }}>
                        {q.answer != null && editingAnswerId !== q.id ? (
                          <View style={styles.questionAdminAnswered}>
                            <Text style={styles.questionAdminAnsweredLabel}>Svar:</Text>
                            <Text style={styles.questionAdminAnsweredText}>{q.answer}</Text>
                          </View>
                        ) : (
                          <View style={styles.questionAdminInputRow}>
                            <TextInput
                              style={[styles.questionAdminInput, { minHeight: 100 }]}
                              placeholder="Skriv svar…"
                              placeholderTextColor="#B8B0A0"
                              value={answerInputs[q.id] ?? ''}
                              onChangeText={(t) => setAnswerInputs((prev) => ({ ...prev, [q.id]: t }))}
                              multiline
                              numberOfLines={5}
                            />
                            <TouchableOpacity
                              style={[styles.publishBtn, { flex: 1 }]}
                              onPress={() => handleAnswer(q.id)}
                              disabled={!(answerInputs[q.id] ?? '').trim()}
                            >
                              <Text style={styles.publishBtnText}>Spara svar</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          {q.answer != null && editingAnswerId !== q.id && (
                            <TouchableOpacity style={[styles.quizEditBtn, { alignSelf: 'flex-start' }]} onPress={() => { setEditingAnswerId(q.id); setAnswerInputs(prev => ({ ...prev, [q.id]: q.answer ?? '' })); }}>
                              <Text style={styles.quizEditBtnText}>Redigera svar</Text>
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity style={[styles.quizEditBtn, { backgroundColor: '#FFF0F0', alignSelf: 'flex-start' }]} onPress={() => deleteQuestion(q.id)}>
                            <Text style={[styles.quizEditBtnText, { color: '#C0392B' }]}>Ta bort</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )
        ) : null}
      </View>

      {/* ===== SECTION DIVIDER: UNDER CYKELFESTEN ===== */}
      <View style={styles.groupDividerUnder}>
        <Text style={styles.groupDividerLabel}>UNDER CYKELFESTEN</Text>
        <Text style={styles.groupDividerSub}>Hantera aktiviteter och placeringar</Text>
      </View>

      {/* Schema — program stops */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('schema')}>
          <View style={styles.accordionLabelWrap}>
            <Text style={styles.accordionLabel}>PROGRAM (6 aktiviteter)</Text>
            <Text style={styles.accordionSub}>Dagens schema och tidpunkter för varje stopp</Text>
          </View>
          {expanded['schema'] ? <ChevronUp size={16} color="#9A8E78" /> : <ChevronDown size={16} color="#9A8E78" />}
        </TouchableOpacity>
        {expanded['schema'] ? (
          <View style={styles.card}>
            {/* Kronologisk ordning: Förrätt → Gruppaktivitet 1 → Varmrätt → Gruppaktivitet 2 → Efterrätt → Avslutningsfesten */}
            {[
              { type: 'meal', label: 'Förrätt' },
              { type: 'stop', id: 'aktivitet_1', label: 'Gruppaktivitet 1' },
              { type: 'meal', label: 'Varmrätt' },
              { type: 'stop', id: 'aktivitet_2', label: 'Gruppaktivitet 2' },
              { type: 'meal', label: 'Efterrätt' },
              { type: 'stop', id: 'avslutningsfesten', label: 'Avslutningsfesten' },
            ].map((item, i) => {
              if (item.type === 'meal') {
                return (
                  <View key={item.label}>
                    {i > 0 && <View style={styles.phaseDivider} />}
                    <View style={{ paddingVertical: 10, gap: 4 }}>
                      <Text style={styles.phaseLabel}>{item.label}</Text>
                      <TouchableOpacity
                        onPress={() => scrollToVardinfo()}
                        style={{ backgroundColor: '#F5F0E8', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 }}
                      >
                        <Text style={[styles.phaseDesc, { color: '#6A6055' }]}>Adresser och gästlistor redigeras under</Text>
                        <Text style={[styles.phaseDesc, { color: '#1C4F4A', fontFamily: 'DMSans_600SemiBold', textDecorationLine: 'underline', marginTop: 2 }]}>Mitt värdskap ↓</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }
              const stopData = programStops.find(s => s.id === item.id);
              const isEditing = editingStop?.id === item.id;
              const isParty = item.id === 'avslutningsfesten';
              return (
                <View key={item.id}>
                  {i > 0 && <View style={styles.phaseDivider} />}
                  <View style={{ paddingVertical: 10 }}>
                    <Text style={[styles.phaseLabel, { marginBottom: 6 }]}>{item.label}</Text>
                    <TouchableOpacity
                      style={[styles.quizEditBtn, { alignSelf: 'flex-start', marginBottom: 8 }, isEditing && { backgroundColor: '#F5E8E8' }]}
                      onPress={() => {
                        if (isEditing) {
                          setEditingStop(null);
                        } else {
                          setEditingStop({
                            id: item.id!,
                            description: stopData?.description ?? '',
                            rules: stopData?.rules ?? '',
                            scoring: stopData?.scoring ?? '',
                          });
                        }
                      }}
                    >
                      <Text style={[styles.quizEditBtnText, isEditing && { color: '#A04040' }]}>
                        {isEditing ? 'Stäng' : 'Redigera'}
                      </Text>
                    </TouchableOpacity>
                    {isEditing && editingStop ? (
                      <View style={{ gap: 8 }}>
                        <Text style={styles.formLabel}>{isParty ? 'BESKRIVNING' : 'TÄVLING'}</Text>
                        <TextInput
                          style={[styles.input, styles.textArea]}
                          value={editingStop.description}
                          onChangeText={t => setEditingStop(prev => prev ? { ...prev, description: t } : prev)}
                          placeholder={isParty ? 'Beskrivning av festen…' : 'Beskrivning av tävlingen…'}
                          placeholderTextColor="#B8B0A0"
                          multiline
                          numberOfLines={3}
                          testID={`stop-description-input-${item.id}`}
                        />
                        <Text style={styles.formLabel}>{isParty ? 'PRAKTISK INFORMATION' : 'REGLER'}</Text>
                        <TextInput
                          style={[styles.input, styles.textArea]}
                          value={editingStop.rules}
                          onChangeText={t => setEditingStop(prev => prev ? { ...prev, rules: t } : prev)}
                          placeholder={isParty ? 'Praktisk information om festen…' : 'Regler för aktiviteten…'}
                          placeholderTextColor="#B8B0A0"
                          multiline
                          numberOfLines={3}
                          testID={`stop-rules-input-${item.id}`}
                        />
                        <Text style={styles.formLabel}>{isParty ? 'ÖVRIG INFORMATION' : 'POÄNGRÄKNING'}</Text>
                        <TextInput
                          style={[styles.input, styles.textArea]}
                          value={editingStop.scoring}
                          onChangeText={t => setEditingStop(prev => prev ? { ...prev, scoring: t } : prev)}
                          placeholder={isParty ? 'Övrig information från kaninen…' : 'Hur poäng räknas…'}
                          placeholderTextColor="#B8B0A0"
                          multiline
                          numberOfLines={3}
                          testID={`stop-scoring-input-${item.id}`}
                        />
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <TouchableOpacity style={[styles.publishBtn, { flex: 1 }]} onPress={saveStop} testID={`stop-save-btn-${item.id}`}>
                            <Text style={styles.publishBtnText}>Spara</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.adminBtnSecondary, { flex: 1 }]} onPress={() => setEditingStop(null)}>
                            <Text style={styles.adminBtnSecondaryText}>Avbryt</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}
      </View>

      {/* Ledtrådar */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.accordionHeader} onPress={() => { toggleSection('ledtrad'); if (!expanded['ledtrad']) fetchDestQuizzes(); }}>
          <View style={styles.accordionLabelWrap}>
            <Text style={styles.accordionLabel}>LEDTRÅDAR ({destQuizzes.reduce((sum, q) => sum + q.questions.length, 0)} frågor)</Text>
            <Text style={styles.accordionSub}>Quiz och destinationsbild för olika aktiviteter</Text>
          </View>
          {expanded['ledtrad'] ? <ChevronUp size={16} color="#9A8E78" /> : <ChevronDown size={16} color="#9A8E78" />}
        </TouchableOpacity>
        {expanded['ledtrad'] ? (
          <View style={styles.card}>
            {destQuizzesLoading ? (
              <ActivityIndicator color="#7A6B55" style={{ margin: 20 }} />
            ) : (
              (['förrätt', 'varmrätt', 'efterrätt'] as const).map((course) => {
                const quiz = destQuizzes.find(q => q.course === course);
                const questions: DQuestion[] = quiz?.questions ?? [];
                const courseLabel = course === 'förrätt' ? 'Förrätt' : course === 'varmrätt' ? 'Varmrätt' : 'Efterrätt';
                const courseEmoji = course === 'förrätt' ? '🥗' : course === 'varmrätt' ? '🍖' : '🍮';
                const courseUnlockDate = course === 'förrätt' ? ledtradForrattDate : course === 'varmrätt' ? ledtradVarmrattDate : ledtradEfterrattDate;
                const courseSetDate = course === 'förrätt' ? setLedtradForrattDate : course === 'varmrätt' ? setLedtradVarmrattDate : setLedtradEfterrattDate;
                const courseSettingKey = course === 'förrätt' ? 'unlock_ledtrad_forratt' : course === 'varmrätt' ? 'unlock_ledtrad_varmratt' : 'unlock_ledtrad_efterratt';
                const isCourseUnlocked = new Date() >= courseUnlockDate;
                const fmtD = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
                return (
                  <View key={course} style={{ marginBottom: 4, borderBottomWidth: 1, borderBottomColor: '#EDE6D6' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}>
                      <TouchableOpacity
                        onPress={() => toggleSection(`course_${course}`)}
                        style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                      >
                        <Text style={[styles.phaseLabel, { fontSize: 13, fontFamily: 'DMSans_700Bold', flex: 1 }]}>{courseEmoji} {courseLabel}</Text>
                        {expanded[`course_${course}`] ? <ChevronUp size={16} color="#9A8E78" /> : <ChevronDown size={16} color="#9A8E78" />}
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={async () => {
                          const newDate = isCourseUnlocked ? new Date('2099-01-01T00:00') : new Date(Date.now() - 60000);
                          courseSetDate(newDate);
                          try { await api.post(`/api/cykelfest/settings/${courseSettingKey}`, { value: fmtD(newDate) }); } catch {}
                        }}
                        style={{ backgroundColor: isCourseUnlocked ? '#7A2E2E' : '#2A6B64', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, marginLeft: 10 }}
                      >
                        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 11, color: '#fff' }}>{isCourseUnlocked ? '🔒 Lås' : '🔓 Lås upp'}</Text>
                      </TouchableOpacity>
                    </View>
                    {!!expanded[`course_${course}`] && (
                      <View style={{ paddingBottom: 16 }}>

                    {/* Unlock time picker */}
                    <View style={{ backgroundColor: '#EAE4D4', borderRadius: 10, padding: 12, marginBottom: 10 }}>
                      <Text style={[styles.formLabel, { marginBottom: 8 }]}>ÖPPNAS FÖR DELTAGARE KL</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {(['h', 'min'] as const).map((field) => {
                          const curVal = field === 'h' ? courseUnlockDate.getHours() : courseUnlockDate.getMinutes();
                          const step = field === 'min' ? 5 : 1;
                          const max = field === 'h' ? 23 : 59;
                          const w = field === 'h' ? 32 : 44;
                          const bump = (delta: number) => {
                            const next = new Date(courseUnlockDate);
                            const v = Math.max(0, Math.min(max, curVal + delta));
                            if (field === 'h') next.setHours(v); else next.setMinutes(v);
                            courseSetDate(next);
                          };
                          return (
                            <React.Fragment key={field}>
                              <View style={{ alignItems: 'center', gap: 4 }}>
                                <TouchableOpacity style={{ width: w, height: 32, borderRadius: 8, backgroundColor: '#4A9E44', alignItems: 'center', justifyContent: 'center' }} onPress={() => bump(step)}>
                                  <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 18, color: '#fff', lineHeight: 32 }}>+</Text>
                                </TouchableOpacity>
                                <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: '#2A2A2A', textAlign: 'center', width: w }}>{String(curVal).padStart(2,'0')}</Text>
                                <TouchableOpacity style={{ width: w, height: 32, borderRadius: 8, backgroundColor: '#4A9E44', alignItems: 'center', justifyContent: 'center' }} onPress={() => bump(-step)}>
                                  <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 18, color: '#fff', lineHeight: 32 }}>−</Text>
                                </TouchableOpacity>
                              </View>
                              {field === 'h' && <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 22, color: '#2A2A2A' }}>:</Text>}
                            </React.Fragment>
                          );
                        })}
                        <TouchableOpacity
                          onPress={async () => { try { await api.post(`/api/cykelfest/settings/${courseSettingKey}`, { value: fmtD(courseUnlockDate) }); } catch {} }}
                          style={{ backgroundColor: '#2A6B64', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, marginLeft: 8 }}
                        >
                          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 13, color: '#fff' }}>Spara</Text>
                        </TouchableOpacity>
                        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#7A6B55', flex: 1 }}>
                          {isCourseUnlocked ? '✓ Öppen nu' : `Låst tills kl ${String(courseUnlockDate.getHours()).padStart(2,'0')}:${String(courseUnlockDate.getMinutes()).padStart(2,'0')}`}
                        </Text>
                      </View>
                    </View>

                    {/* Destination image URL */}
                    {editingImageCourse === course ? (
                      <View style={{ backgroundColor: '#EAE4D4', borderRadius: 10, padding: 12, marginBottom: 10 }}>
                        <Text style={[styles.formLabel, { marginBottom: 6 }]}>DESTINATIONS-BILD</Text>
                        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                          <TextInput value={editImageUrl} onChangeText={setEditImageUrl} style={[styles.input, { flex: 1 }]} placeholder="https://..." placeholderTextColor="#B8B0A0" autoCapitalize="none" />
                          <TouchableOpacity
                            onPress={async () => {
                              setUploadingImage(true);
                              try {
                                const file = await pickImage();
                                if (file) {
                                  const result = await uploadPickedFile(file);
                                  setEditImageUrl(result.url);
                                }
                              } catch {} finally { setUploadingImage(false); }
                            }}
                            style={{ backgroundColor: '#2A6B64', borderRadius: 8, padding: 10, justifyContent: 'center', alignItems: 'center', minWidth: 48 }}
                          >
                            {uploadingImage ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ fontSize: 18 }}>🖼</Text>}
                          </TouchableOpacity>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <TouchableOpacity onPress={async () => { try { await api.post('/api/cykelfest/destination-quizzes', { course, imageUrl: editImageUrl.trim() || null }); setEditingImageCourse(null); await fetchDestQuizzes(); } catch {} }} style={{ flex: 1, backgroundColor: '#2A6B64', borderRadius: 8, padding: 8, alignItems: 'center' }}>
                            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 13, color: '#fff' }}>Spara</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => setEditingImageCourse(null)} style={{ flex: 1, backgroundColor: '#E5DFD1', borderRadius: 8, padding: 8, alignItems: 'center' }}>
                            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: '#7A6B55' }}>Avbryt</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity onPress={() => { setEditingImageCourse(course); setEditImageUrl(quiz?.imageUrl ?? ''); }} style={{ backgroundColor: '#EAE4D4', borderRadius: 8, padding: 10, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#7A6B55' }}>
                          {quiz?.imageUrl ? '🖼 Bild inlagd — tryck för att ändra' : '📷 Lägg till destinations-bild (URL)'}
                        </Text>
                        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: '#9A8E78' }}>Ändra</Text>
                      </TouchableOpacity>
                    )}

                    {/* Questions list */}
                    {questions.map((q, qIdx) => {
                      const opts: string[] = JSON.parse(q.options);
                      const contentTypeIcon = q.contentType === 'image' ? '🖼' : q.contentType === 'video' ? '🎬' : q.contentType === 'audio' ? '🔊' : '📝';
                      return (
                        <View key={q.id} style={{ backgroundColor: '#F5EFE0', borderRadius: 10, padding: 12, marginBottom: 8 }}>
                          <TouchableOpacity
                            onPress={() => { if (editingDQId === q.id) { setEditingDQId(null); } else { setEditingDQId(q.id); setEditDQQuestion(q.question); setEditDQOptions(JSON.parse(q.options)); setEditDQCorrect(q.correctAnswer); setEditDQContentType((q.contentType as 'text' | 'image' | 'video' | 'audio') ?? 'text'); setEditDQContentText(q.contentText ?? ''); setEditDQContentUrl(q.contentUrl ?? ''); } }}
                            style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}
                          >
                            <Text style={styles.quizPollIndex}>{contentTypeIcon}</Text>
                            <Text style={[styles.quizPollQuestion, { flex: 1 }]}>Fråga {qIdx + 1}: {q.question}</Text>
                            {editingDQId === q.id ? <ChevronUp size={18} color="#9A8E78" style={{ marginTop: 1 }} /> : <ChevronDown size={18} color="#9A8E78" style={{ marginTop: 1 }} />}
                          </TouchableOpacity>
                          {editingDQId === q.id && (
                            <View style={{ gap: 6, marginTop: 10 }}>
                              {/* Content type selector */}
                              <Text style={[styles.formLabel, { marginBottom: 6 }]}>INNEHÅLLSTYP</Text>
                              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                                {(['text', 'image', 'video', 'audio'] as const).map((ct) => (
                                  <TouchableOpacity key={ct} onPress={() => setEditDQContentType(ct)} style={{ flex: 1, minWidth: 60, padding: 8, borderRadius: 8, alignItems: 'center', backgroundColor: editDQContentType === ct ? '#2A6B64' : '#EAE4D4' }}>
                                    <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 12, color: editDQContentType === ct ? '#fff' : '#7A6B55' }}>{ct === 'text' ? '📝 Text' : ct === 'image' ? '🖼 Bild' : ct === 'audio' ? '🔊 Ljud' : '🎬 Video'}</Text>
                                  </TouchableOpacity>
                                ))}
                              </View>
                              {editDQContentType === 'text' ? (
                                <>
                                  <Text style={[styles.formLabel, { marginBottom: 4 }]}>FRÅGERUBRIK</Text>
                                  <TextInput value={editDQContentText} onChangeText={setEditDQContentText} style={[styles.input, { marginBottom: 8 }]} placeholder="T.ex. Vad heter platsen?" placeholderTextColor="#B8B0A0" />
                                </>
                              ) : (
                                <>
                                  <Text style={[styles.formLabel, { marginBottom: 4 }]}>{editDQContentType === 'image' ? 'BILD-URL' : editDQContentType === 'audio' ? 'LJUD-URL (MP3)' : 'VIDEO-URL'}</Text>
                                  <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                                    <TextInput value={editDQContentUrl} onChangeText={setEditDQContentUrl} style={[styles.input, { flex: 1 }]} placeholder="https://..." placeholderTextColor="#B8B0A0" autoCapitalize="none" />
                                    <TouchableOpacity
                                      onPress={async () => {
                                        setUploadingContentUrl(true);
                                        try {
                                          const file = editDQContentType === 'image' ? await pickImage() : editDQContentType === 'audio' ? await pickAudio() : await pickVideo();
                                          if (file) {
                                            const result = await uploadPickedFile(file);
                                            setEditDQContentUrl(result.url);
                                          }
                                        } catch {} finally { setUploadingContentUrl(false); }
                                      }}
                                      style={{ backgroundColor: '#2A6B64', borderRadius: 8, padding: 10, justifyContent: 'center', alignItems: 'center', minWidth: 48 }}
                                    >
                                      {uploadingContentUrl ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ fontSize: 18 }}>{editDQContentType === 'image' ? '🖼' : editDQContentType === 'audio' ? '🔊' : '🎬'}</Text>}
                                    </TouchableOpacity>
                                  </View>
                                  {editDQContentType === 'audio' && (
                                    <>
                                      <Text style={[styles.formLabel, { marginBottom: 4 }]}>LEDTEXT (valfri)</Text>
                                      <TextInput value={editDQContentText} onChangeText={setEditDQContentText} style={[styles.input, { marginBottom: 8 }]} placeholder="T.ex. Lyssna noga..." placeholderTextColor="#B8B0A0" />
                                    </>
                                  )}
                                </>
                              )}
                              <Text style={[styles.formLabel, { marginBottom: 4 }]}>FRÅGA</Text>
                              <TextInput value={editDQQuestion} onChangeText={setEditDQQuestion} style={[styles.input, { marginBottom: 6, height: 80, textAlignVertical: 'top' }]} placeholder="Frågetext" placeholderTextColor="#B8B0A0" multiline />
                              {editDQOptions.map((opt, oi) => (
                                <TextInput key={oi} value={opt} onChangeText={(t) => setEditDQOptions(prev => { const n = [...prev]; n[oi] = t; return n; })} style={[styles.input, { marginBottom: 4 }]} placeholder={`Alternativ ${oi + 1}`} placeholderTextColor="#B8B0A0" />
                              ))}
                              <Text style={[styles.formLabel, { marginTop: 6, marginBottom: 4 }]}>RÄTT SVAR</Text>
                              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                                {editDQOptions.map((opt, oi) => (
                                  <TouchableOpacity key={oi} onPress={() => setEditDQCorrect(oi)} style={{ flex: 1, padding: 8, borderRadius: 8, alignItems: 'center', backgroundColor: editDQCorrect === oi ? '#2A6B64' : '#EAE4D4' }}>
                                    <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 12, color: editDQCorrect === oi ? '#fff' : '#7A6B55' }}>{oi + 1}</Text>
                                  </TouchableOpacity>
                                ))}
                              </View>
                              <View style={{ flexDirection: 'row', gap: 8 }}>
                                <TouchableOpacity onPress={async () => { try { await api.put(`/api/cykelfest/destination-quizzes/questions/${q.id}`, { question: editDQQuestion, options: editDQOptions, correctAnswer: editDQCorrect, contentType: editDQContentType, contentText: (editDQContentType === 'text' || editDQContentType === 'audio') ? editDQContentText : null, contentUrl: editDQContentType !== 'text' ? editDQContentUrl : null }); setEditingDQId(null); await fetchDestQuizzes(); } catch {} }} style={{ flex: 1, backgroundColor: '#2A6B64', borderRadius: 8, padding: 8, alignItems: 'center' }}>
                                  <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 13, color: '#fff' }}>Spara</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={async () => { try { await api.delete(`/api/cykelfest/destination-quizzes/questions/${q.id}`); setEditingDQId(null); await fetchDestQuizzes(); } catch {} }} style={{ flex: 1, backgroundColor: '#FDECEA', borderRadius: 8, padding: 8, alignItems: 'center' }}>
                                  <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 13, color: '#C0392B' }}>Ta bort</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setEditingDQId(null)} style={{ flex: 1, backgroundColor: '#E5DFD1', borderRadius: 8, padding: 8, alignItems: 'center' }}>
                                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: '#7A6B55' }}>Stäng</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          )}
                        </View>
                      );
                    })}

                    {/* Add new question (max 5) */}
                    {questions.length < 5 && (
                      newDQCourse === course ? (
                        <View style={{ backgroundColor: '#EAE4D4', borderRadius: 10, padding: 12 }}>
                          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 13, color: '#5A4E3A', marginBottom: 10 }}>Fråga {questions.length + 1} av 5</Text>
                          {/* Content type */}
                          <Text style={[styles.formLabel, { marginBottom: 6 }]}>INNEHÅLLSTYP</Text>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                            {(['text', 'image', 'video', 'audio'] as const).map((ct) => (
                              <TouchableOpacity key={ct} onPress={() => setNewDQContentType(ct)} style={{ paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, alignItems: 'center', backgroundColor: newDQContentType === ct ? '#2A6B64' : '#F5EFE0' }}>
                                <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 12, color: newDQContentType === ct ? '#fff' : '#7A6B55' }}>{ct === 'text' ? '📝 Text' : ct === 'image' ? '🖼 Bild' : ct === 'video' ? '🎬 Video' : '🔊 Ljud'}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                          {newDQContentType === 'text' ? (
                            <>
                              <Text style={[styles.formLabel, { marginBottom: 4 }]}>FRÅGERUBRIK</Text>
                              <TextInput value={newDQContentText} onChangeText={setNewDQContentText} style={[styles.input, { marginBottom: 8 }]} placeholder="T.ex. Vad heter platsen?" placeholderTextColor="#B8B0A0" />
                            </>
                          ) : (
                            <>
                              <Text style={[styles.formLabel, { marginBottom: 4 }]}>{newDQContentType === 'image' ? 'BILD-URL' : newDQContentType === 'audio' ? 'LJUD-URL (MP3)' : 'VIDEO-URL'}</Text>
                              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                                <TextInput value={newDQContentUrl} onChangeText={setNewDQContentUrl} style={[styles.input, { flex: 1 }]} placeholder="https://..." placeholderTextColor="#B8B0A0" autoCapitalize="none" />
                                <TouchableOpacity
                                    onPress={async () => {
                                      setUploadingContentUrl(true);
                                      try {
                                        const file = newDQContentType === 'image' ? await pickImage() : newDQContentType === 'audio' ? await pickAudio() : await pickVideo();
                                        if (file) {
                                          const result = await uploadPickedFile(file);
                                          setNewDQContentUrl(result.url);
                                        }
                                      } catch {} finally { setUploadingContentUrl(false); }
                                    }}
                                    style={{ backgroundColor: '#2A6B64', borderRadius: 8, padding: 10, justifyContent: 'center', alignItems: 'center', minWidth: 48 }}
                                  >
                                    {uploadingContentUrl ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ fontSize: 18 }}>{newDQContentType === 'image' ? '🖼' : newDQContentType === 'audio' ? '🔊' : '🎬'}</Text>}
                                  </TouchableOpacity>
                              </View>
                              {newDQContentType === 'audio' && (
                                <>
                                  <Text style={[styles.formLabel, { marginBottom: 4 }]}>LEDTEXT (valfri)</Text>
                                  <TextInput value={newDQContentText} onChangeText={setNewDQContentText} style={[styles.input, { marginBottom: 8 }]} placeholder="T.ex. Vad låter det här som?" placeholderTextColor="#B8B0A0" />
                                </>
                              )}
                            </>
                          )}
                          <Text style={[styles.formLabel, { marginBottom: 4 }]}>FRÅGA</Text>
                          <TextInput value={newDQQuestion} onChangeText={setNewDQQuestion} style={[styles.input, { marginBottom: 6, height: 80, textAlignVertical: 'top' }]} placeholder="Frågetext" placeholderTextColor="#B8B0A0" multiline />
                          {newDQOptions.map((opt, oi) => (
                            <TextInput key={oi} value={opt} onChangeText={(t) => setNewDQOptions(prev => { const n = [...prev]; n[oi] = t; return n; })} style={[styles.input, { marginBottom: 4 }]} placeholder={`Alternativ ${oi + 1}`} placeholderTextColor="#B8B0A0" />
                          ))}
                          <Text style={[styles.formLabel, { marginTop: 6, marginBottom: 4 }]}>RÄTT SVAR</Text>
                          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
                            {newDQOptions.map((_, oi) => (
                              <TouchableOpacity key={oi} onPress={() => setNewDQCorrect(oi)} style={{ flex: 1, padding: 8, borderRadius: 8, alignItems: 'center', backgroundColor: newDQCorrect === oi ? '#2A6B64' : '#F5EFE0' }}>
                                <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 12, color: newDQCorrect === oi ? '#fff' : '#7A6B55' }}>{oi + 1}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                          <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TouchableOpacity
                              onPress={async () => {
                                if (!newDQQuestion.trim() || newDQOptions.some(o => !o.trim())) return;
                                try {
                                  await api.post(`/api/cykelfest/destination-quizzes/${encodeURIComponent(course)}/questions`, {
                                    question: newDQQuestion.trim(), options: newDQOptions.map(o => o.trim()), correctAnswer: newDQCorrect, orderIndex: questions.length,
                                    contentType: newDQContentType,
                                    contentText: (newDQContentType === 'text' || newDQContentType === 'audio') ? newDQContentText.trim() || null : null,
                                    contentUrl: newDQContentType !== 'text' ? newDQContentUrl.trim() || null : null,
                                  });
                                  setNewDQCourse(null); setNewDQQuestion(''); setNewDQOptions(['', '', '', '']); setNewDQCorrect(0); setNewDQContentType('text'); setNewDQContentText(''); setNewDQContentUrl('');
                                  await fetchDestQuizzes();
                                } catch {}
                              }}
                              style={{ flex: 1, backgroundColor: '#2A6B64', borderRadius: 8, padding: 8, alignItems: 'center' }}
                            >
                              <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 13, color: '#fff' }}>Spara fråga</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => { setNewDQCourse(null); setNewDQQuestion(''); setNewDQOptions(['', '', '', '']); setNewDQCorrect(0); setNewDQContentType('text'); setNewDQContentText(''); setNewDQContentUrl(''); }} style={{ flex: 1, backgroundColor: '#E5DFD1', borderRadius: 8, padding: 8, alignItems: 'center' }}>
                              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: '#7A6B55' }}>Stäng</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <TouchableOpacity onPress={() => { setNewDQCourse(course); setNewDQQuestion(''); setNewDQOptions(['', '', '', '']); setNewDQCorrect(0); setNewDQContentType('text'); setNewDQContentText(''); setNewDQContentUrl(''); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EAE4D4', borderRadius: 8, padding: 10 }}>
                          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: '#7A6B55' }}>+ Lägg till fråga ({questions.length + 1}/5)</Text>
                        </TouchableOpacity>
                      )
                    )}
                    {questions.length >= 5 && (
                      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#9A8E78', textAlign: 'center', padding: 8 }}>Max 5 frågor uppnått</Text>
                    )}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        ) : null}
      </View>

      {/* Leaderboard */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('poang')}>
          <View style={styles.accordionLabelWrap}>
            <Text style={styles.accordionLabel}>LEADERBOARD ({teams.length} lag)</Text>
            <Text style={styles.accordionSub}>Poängtavla och lagranking i realtid</Text>
          </View>
          {expanded['poang'] ? <ChevronUp size={16} color="#9A8E78" /> : <ChevronDown size={16} color="#9A8E78" />}
        </TouchableOpacity>
        {expanded['poang'] ? (
          <View style={[styles.card, { paddingBottom: 16 }]}>
            <Text style={[styles.phaseLabel, { padding: 14, paddingBottom: 8 }]}>Fyll i poäng per lag och deltävling</Text>

            {/* Tabellhuvud */}
            <View style={{ flexDirection: 'row', paddingHorizontal: 14, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#EDE6D6' }}>
              <Text style={{ flex: 1, fontFamily: 'SpaceMono_400Regular', fontSize: 9, color: '#9A8E78', letterSpacing: 1 }}>LAG</Text>
              {PHASE_LABELS.map((label, pi) => (
                <Text key={pi} style={{ width: 44, fontFamily: 'SpaceMono_400Regular', fontSize: 9, color: '#9A8E78', letterSpacing: 1, textAlign: 'center' }}>D{pi + 1}</Text>
              ))}
            </View>

            {/* En rad per lag */}
            {teams.length === 0 ? (
              <Text style={[styles.placeholderText, { padding: 14 }]}>Inga lag hittades — importera deltagare först</Text>
            ) : (
              teams.map((team, ti) => (
                <View key={team.id} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: ti < teams.length - 1 ? 1 : 0, borderBottomColor: '#F5F0E8' }}>
                  {/* Lagnamn med färgprick */}
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: 8 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, flexShrink: 0, backgroundColor: team.color ?? '#A8D4B8' }} />
                    <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: '#2A2A2A', flexShrink: 1 }} numberOfLines={1}>{team.name}</Text>
                  </View>
                  {/* Poänginmatning per deltävling */}
                  {[0, 1, 2].map(pi => (
                    <TextInput
                      key={pi}
                      style={{
                        width: 44,
                        height: 32,
                        backgroundColor: '#F5F0E8',
                        borderRadius: 8,
                        textAlign: 'center',
                        fontFamily: 'DMSans_600SemiBold',
                        fontSize: 14,
                        color: '#2A2A2A',
                        borderWidth: 1,
                        borderColor: getScoreInput(team.id, pi) ? '#1C4F4A' : '#E0D8C8',
                      }}
                      value={getScoreInput(team.id, pi)}
                      onChangeText={val => setScoreInput(team.id, pi, val)}
                      keyboardType="number-pad"
                      placeholder="—"
                      placeholderTextColor="#B8B0A0"
                      maxLength={3}
                    />
                  ))}
                </View>
              ))
            )}

            {/* Knappar */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12, marginHorizontal: 14 }}>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: scoreSaved ? '#1C4F4A' : '#2A2A3A', borderRadius: 10, paddingVertical: 13, alignItems: 'center' }}
                onPress={handleSaveScores}
                disabled={scoreLoading}
              >
                <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: '#fff' }}>
                  {scoreSaved ? '✓ Sparat' : scoreLoading ? 'Sparar...' : 'Spara poäng'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: '#8B1A1A', borderRadius: 10, paddingVertical: 13, paddingHorizontal: 16, alignItems: 'center' }}
                onPress={() => Alert.alert('Rensa all poäng?', 'Detta tar bort ALL poängdata permanent.', [
                  { text: 'Avbryt', style: 'cancel' },
                  { text: 'Rensa', style: 'destructive', onPress: async () => {
                    await api.delete('/api/cykelfest/scores');
                    setScoreInputs({});
                  }},
                ])}
              >
                <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: '#fff' }}>Rensa</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </View>

      {/* SOS & NÖDKONTAKTER */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('sos')}>
          <View style={styles.accordionLabelWrap}>
            <Text style={[styles.accordionLabel, styles.sectionLabelRed]}>SOS & NÖDKONTAKTER</Text>
            <Text style={styles.accordionSub}>Nödinformation och kontakter för akuta situationer</Text>
          </View>
          {expanded['sos'] ? <ChevronUp size={16} color="#C0392B" /> : <ChevronDown size={16} color="#C0392B" />}
        </TouchableOpacity>
        {expanded['sos'] ? (
          <View style={[styles.card, { gap: 16 }]}>
            <Text style={styles.phaseLabel}>Redigera nödkontakter och återsamlingsplats i SOS-fliken</Text>

            <View style={{ height: 1, backgroundColor: '#EDE6D6' }} />
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 13, color: '#C0392B', letterSpacing: 0.5 }}>KONTAKT 1</Text>
            <Text style={styles.formLabel}>NAMN</Text>
            <TextInput
              style={styles.formInput}
              value={sosContact1Name}
              onChangeText={setSosContact1Name}
              placeholder="t.ex. Nödnummer"
              placeholderTextColor="#B8B0A0"
            />
            <Text style={styles.formLabel}>NUMMER</Text>
            <TextInput
              style={styles.formInput}
              value={sosContact1Number}
              onChangeText={setSosContact1Number}
              placeholder="t.ex. 112"
              placeholderTextColor="#B8B0A0"
              keyboardType="phone-pad"
            />

            <View style={{ height: 1, backgroundColor: '#EDE6D6' }} />
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 13, color: '#2A5FA8', letterSpacing: 0.5 }}>KONTAKT 2</Text>
            <Text style={styles.formLabel}>NAMN</Text>
            <TextInput
              style={styles.formInput}
              value={sosContact2Name}
              onChangeText={setSosContact2Name}
              placeholder="t.ex. Kaninen"
              placeholderTextColor="#B8B0A0"
            />
            <Text style={styles.formLabel}>NUMMER</Text>
            <TextInput
              style={styles.formInput}
              value={sosContact2Number}
              onChangeText={setSosContact2Number}
              placeholder="t.ex. +46700000000"
              placeholderTextColor="#B8B0A0"
              keyboardType="phone-pad"
            />

            <View style={{ height: 1, backgroundColor: '#EDE6D6' }} />
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 13, color: '#C4814A', letterSpacing: 0.5 }}>KONTAKT 3</Text>
            <Text style={styles.formLabel}>NAMN</Text>
            <TextInput
              style={styles.formInput}
              value={sosContact3Name}
              onChangeText={setSosContact3Name}
              placeholder="t.ex. Taxi Uppsala"
              placeholderTextColor="#B8B0A0"
            />
            <Text style={styles.formLabel}>NUMMER</Text>
            <TextInput
              style={styles.formInput}
              value={sosContact3Number}
              onChangeText={setSosContact3Number}
              placeholder="t.ex. 08157000"
              placeholderTextColor="#B8B0A0"
              keyboardType="phone-pad"
            />


            <TouchableOpacity
              style={{ backgroundColor: '#8B1A1A', borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 4 }}
              onPress={async () => {
                try {
                  await Promise.all([
                    api.post('/api/cykelfest/settings/sos_contact1_name', { value: sosContact1Name }),
                    api.post('/api/cykelfest/settings/sos_contact1_number', { value: sosContact1Number }),
                    api.post('/api/cykelfest/settings/sos_contact2_name', { value: sosContact2Name }),
                    api.post('/api/cykelfest/settings/sos_contact2_number', { value: sosContact2Number }),
                    api.post('/api/cykelfest/settings/sos_contact3_name', { value: sosContact3Name }),
                    api.post('/api/cykelfest/settings/sos_contact3_number', { value: sosContact3Number }),
                  ]);
                  setSosSaved(true);
                  setTimeout(() => setSosSaved(false), 2500);
                } catch {
                  Alert.alert('Fel', 'Kunde inte spara SOS-inställningar.');
                }
              }}
            >
              <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: '#fff' }}>{sosSaved ? '✓ Sparat' : 'Spara SOS-inställningar'}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {/* ===== SECTION DIVIDER: EFTER CYKELFESTEN ===== */}
      <View style={styles.groupDividerEfter}>
        <Text style={styles.groupDividerLabel}>EFTER CYKELFESTEN</Text>
        <Text style={styles.groupDividerSub}>Återkoppling och feedback</Text>
      </View>

      {/* Återkoppling */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.accordionHeader} onPress={() => { toggleSection('aterkoppling'); if (!expanded['aterkoppling']) { fetchFeedback(); fetchFbQuestions(); } }}>
          <View style={styles.accordionLabelWrap}>
            <Text style={styles.accordionLabel}>ÅTERKOPPLING ({feedbackData.length} svar)</Text>
            <Text style={styles.accordionSub}>Samla in och visa återkoppling från deltagarna</Text>
          </View>
          {expanded['aterkoppling'] ? <ChevronUp size={16} color="#9A8E78" /> : <ChevronDown size={16} color="#9A8E78" />}
        </TouchableOpacity>
        {expanded['aterkoppling'] ? (
          <>
            {/* Question editor */}
            <View style={[styles.card, { marginBottom: 8 }]}>
              <Pressable
                onPress={() => {
                  if (!fbQuestionsEditing) {
                    setFbQuestionsEdit(fbQuestions.map(q => ({ question: q.question, options: [...q.options] })));
                  }
                  setFbQuestionsEditing(v => !v);
                }}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <Text style={{ fontFamily: 'SpaceMono_400Regular', fontSize: 10, color: '#9A8E78', letterSpacing: 1 }}>REDIGERA FRÅGOR</Text>
                {fbQuestionsLoading ? (
                  <ActivityIndicator size="small" color="#9A8E78" />
                ) : (
                  <Pencil size={14} color={fbQuestionsEditing ? '#5A3800' : '#9A8E78'} />
                )}
              </Pressable>
              {fbQuestionsEditing ? (
                <View style={{ marginTop: 12, gap: 16 }}>
                  {fbQuestionsEdit.map((q, i) => (
                    <View key={i} style={{ gap: 6 }}>
                      <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 11, color: '#5A3800', marginBottom: 2 }}>Fråga {i + 1}</Text>
                      <TextInput
                        value={q.question}
                        onChangeText={(text) => {
                          const next = [...fbQuestionsEdit];
                          next[i] = { ...next[i], question: text };
                          setFbQuestionsEdit(next);
                        }}
                        style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#E0D8C8', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, fontFamily: 'DMSans_400Regular', fontSize: 13, color: '#3A3A3A' }}
                        placeholder="Frågetext..."
                        placeholderTextColor="#C0B8A8"
                        multiline
                      />
                      <Text style={{ fontFamily: 'SpaceMono_400Regular', fontSize: 9, color: '#9A8E78', letterSpacing: 0.5, marginTop: 2 }}>ALTERNATIV</Text>
                      {q.options.map((opt, j) => (
                        <View key={j} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <TextInput
                            value={opt}
                            onChangeText={(text) => {
                              const next = [...fbQuestionsEdit];
                              const newOpts = [...next[i].options];
                              newOpts[j] = text;
                              next[i] = { ...next[i], options: newOpts };
                              setFbQuestionsEdit(next);
                            }}
                            style={{ flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E0D8C8', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#3A3A3A' }}
                            placeholder={`Alternativ ${j + 1}`}
                            placeholderTextColor="#C0B8A8"
                          />
                          {q.options.length > 2 ? (
                            <Pressable
                              onPress={() => {
                                const next = [...fbQuestionsEdit];
                                const newOpts = next[i].options.filter((_, idx) => idx !== j);
                                next[i] = { ...next[i], options: newOpts };
                                setFbQuestionsEdit(next);
                              }}
                              style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#F0E8D8', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: '#9A5A3A', lineHeight: 16 }}>×</Text>
                            </Pressable>
                          ) : null}
                        </View>
                      ))}
                      {q.options.length < 6 ? (
                        <Pressable
                          onPress={() => {
                            const next = [...fbQuestionsEdit];
                            next[i] = { ...next[i], options: [...next[i].options, ''] };
                            setFbQuestionsEdit(next);
                          }}
                          style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: '#D0C8B0', borderStyle: 'dashed' }}
                        >
                          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: '#9A8E78' }}>+ Lägg till alternativ</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  ))}
                  <Pressable
                    onPress={async () => {
                      setFbQuestionsSaving(true);
                      try {
                        await api.put('/api/cykelfest/feedback/questions', {
                          questions: fbQuestionsEdit.map((q, i) => ({ position: i + 1, question: q.question, options: q.options })),
                        });
                        await fetchFbQuestions();
                        setFbQuestionsEditing(false);
                      } catch (e) {
                        Alert.alert('Fel', 'Kunde inte spara frågorna. Försök igen.');
                        console.error('[Admin] save fbQuestions failed:', e);
                      }
                      setFbQuestionsSaving(false);
                    }}
                    style={{ backgroundColor: '#5A3800', borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 4 }}
                  >
                    {fbQuestionsSaving ? (
                      <ActivityIndicator size="small" color="#EDE6D6" />
                    ) : (
                      <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: '#EDE6D6' }}>Spara frågor</Text>
                    )}
                  </Pressable>
                </View>
              ) : null}
            </View>

            {/* Feedback results */}
            {feedbackLoading ? (
              <View style={[styles.card, { alignItems: 'center', paddingVertical: 24 }]}>
                <ActivityIndicator color="#1C4F4A" />
              </View>
            ) : (
              <View style={{ gap: 0, paddingHorizontal: 0 }}>
                {(() => {
                  // Use dynamic question labels from fbQuestions, fallback to hardcoded
                  const getLabel = (position: number, answerIndex: number): string => {
                    const q = fbQuestions.find(fq => fq.position === position);
                    if (q && q.options[answerIndex - 1]) return q.options[answerIndex - 1];
                    const fallback = [
                      ['Fantastisk','Mycket bra','Bra','Okej','Kunde varit bättre'],
                      ['Perfekt lagkemi','Bra stämning','Okej','Lite trögt','Ville byta lag'],
                      ['Ja, absolut!','Troligtvis ja','Vet inte','Troligtvis inte'],
                      ['Lagom utmanande','Lite för enkelt','Lite för svårt','Vi hade inget uppdrag'],
                    ];
                    return fallback[position-1]?.[answerIndex-1] ?? '–';
                  };
                  const getQuestionShort = (position: number): string => {
                    const q = fbQuestions.find(fq => fq.position === position);
                    if (q) {
                      const words = q.question.split(' ');
                      return words.slice(0, 2).join(' ');
                    }
                    return ['Kvällen','Laget','Återkomst','Uppdrag'][position-1] ?? `Q${position}`;
                  };

                  const vals = (key: 'q1'|'q2'|'q3'|'q4') => feedbackData.map(f => f[key]).filter((v): v is number => v !== null);
                  const avg = (key: 'q1'|'q2'|'q3'|'q4') => {
                    const v = vals(key);
                    if (v.length === 0) return null;
                    return v.reduce((a,b) => a+b, 0) / v.length;
                  };

                  const qKeys: ('q1'|'q2'|'q3'|'q4')[] = ['q1','q2','q3','q4'];

                  if (feedbackData.length === 0) {
                    return (
                      <View style={{ alignItems: 'center', paddingVertical: 32, gap: 8 }}>
                        <Text style={{ fontSize: 32 }}>📭</Text>
                        <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: '#9A8E78' }}>Inga svar ännu</Text>
                        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#B0A898' }}>Svar visas här när deltagarna skickar in</Text>
                      </View>
                    );
                  }

                  return (
                    <View style={{ gap: 16 }}>
                      {/* Summary hero */}
                      <View style={{ backgroundColor: '#0F3330', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontFamily: 'SpaceMono_400Regular', fontSize: 8, letterSpacing: 2, color: '#6BBFB0', marginBottom: 4 }}>INKOMNA SVAR</Text>
                          <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 42, color: '#fff', lineHeight: 46 }}>{feedbackData.length}</Text>
                          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: '#A8D4C8', marginTop: 2 }}>
                            {feedbackData.filter(f => f.comment).length} med kommentar
                          </Text>
                        </View>
                        <View style={{ gap: 8 }}>
                          {qKeys.map((key, i) => {
                            const a = avg(key);
                            const maxOpts = fbQuestions.find(fq => fq.position === i+1)?.options.length ?? 5;
                            const pct = a !== null ? ((a - 1) / (maxOpts - 1)) * 100 : 0;
                            return (
                              <View key={key} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={{ fontFamily: 'SpaceMono_400Regular', fontSize: 8, color: 'rgba(255,255,255,0.4)', width: 16 }}>Q{i+1}</Text>
                                <View style={{ width: 80, height: 4, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 2, overflow: 'hidden' }}>
                                  <View style={{ height: 4, borderRadius: 2, backgroundColor: '#3DD68C', width: `${pct}%` as any }} />
                                </View>
                                <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 10, color: '#fff', width: 24 }}>{a !== null ? a.toFixed(1) : '—'}</Text>
                              </View>
                            );
                          })}
                        </View>
                      </View>

                      {/* Per-question breakdown */}
                      {qKeys.map((key, qi) => {
                        const qFull = fbQuestions.find(fq => fq.position === qi+1);
                        const optCount = qFull?.options.length ?? (qi < 2 ? 5 : 4);
                        const distribution = Array.from({ length: optCount }, (_, i) => ({
                          label: getLabel(qi+1, i+1),
                          count: feedbackData.filter(f => f[key] === i+1).length,
                        }));
                        const maxCount = Math.max(...distribution.map(d => d.count), 1);
                        const a = avg(key);
                        return (
                          <View key={key} style={{ backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#EDE6D6' }}>
                            <View style={{ paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#EDE6D6', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                              <View style={{ flex: 1, gap: 1 }}>
                                <Text style={{ fontFamily: 'SpaceMono_400Regular', fontSize: 8, letterSpacing: 1.5, color: '#B0A898' }}>FRÅGA {qi+1}</Text>
                                <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 12, color: '#2A2A2A' }} numberOfLines={2}>{qFull?.question ?? getQuestionShort(qi+1)}</Text>
                              </View>
                              {a !== null ? (
                                <View style={{ backgroundColor: '#EAF5F2', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center', marginLeft: 10 }}>
                                  <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 22, color: '#1C4F4A', lineHeight: 24 }}>{a.toFixed(1)}</Text>
                                  <Text style={{ fontFamily: 'SpaceMono_400Regular', fontSize: 7, color: '#9A8E78' }}>SNITT</Text>
                                </View>
                              ) : null}
                            </View>
                            <View style={{ paddingHorizontal: 14, paddingVertical: 10, gap: 7 }}>
                              {distribution.map(({ label, count }) => (
                                <View key={label} style={{ gap: 3 }}>
                                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: '#5A5040', flex: 1 }} numberOfLines={1}>{label}</Text>
                                    <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 11, color: '#1C4F4A', marginLeft: 8 }}>{count}</Text>
                                  </View>
                                  <View style={{ height: 4, backgroundColor: '#F0EAD8', borderRadius: 2, overflow: 'hidden' }}>
                                    <View style={{ height: 4, borderRadius: 2, backgroundColor: '#2A9E7A', width: count > 0 ? `${Math.round((count / maxCount) * 100)}%` as any : '0%' }} />
                                  </View>
                                </View>
                              ))}
                            </View>
                          </View>
                        );
                      })}

                      {/* Comments */}
                      {feedbackData.some(f => f.comment) ? (
                        <View style={{ backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#EDE6D6' }}>
                          <View style={{ backgroundColor: '#F5F0E8', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#EDE6D6', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <View style={{ width: 3, height: 16, backgroundColor: '#9A8E78', borderRadius: 2 }} />
                            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 11, letterSpacing: 1.5, color: '#5A5040' }}>KOMMENTARER</Text>
                            <View style={{ backgroundColor: '#EDE6D6', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, marginLeft: 4 }}>
                              <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 10, color: '#7A6E5E' }}>{feedbackData.filter(f => f.comment).length}</Text>
                            </View>
                          </View>
                          <View style={{ paddingHorizontal: 14, paddingVertical: 4 }}>
                            {feedbackData.filter(f => f.comment).map((fb, idx, arr) => (
                              <View key={fb.id} style={{ paddingVertical: 12, borderBottomWidth: idx < arr.length - 1 ? 1 : 0, borderBottomColor: '#F5F0E8' }}>
                                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: '#3A3228', fontStyle: 'italic', lineHeight: 20 }}>"{fb.comment}"</Text>
                                <Text style={{ fontFamily: 'SpaceMono_400Regular', fontSize: 8, color: '#C0B8A8', marginTop: 6 }}>
                                  {(() => { const d = new Date(fb.submittedAt); return `${d.getDate()}/${d.getMonth()+1} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; })()}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      ) : null}
                    </View>
                  );
                })()}
              </View>
            )}
          </>
        ) : null}

        {/* Reset feedback button moved to installningar > Efter festen section */}
      </View>
      <View style={[styles.groupDividerEfter, { backgroundColor: '#2A2A3A' }]}>
        <Text style={styles.groupDividerLabel}>INSTÄLLNINGAR</Text>
        <Text style={styles.groupDividerSub}>Styr upplåsning av sektioner</Text>
      </View>

      <View ref={installningarRef} style={styles.section}>
        <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('installningar')}>
          <View style={styles.accordionLabelWrap}>
            <Text style={styles.accordionLabel}>UPPLÅSNINGSTIDER</Text>
            <Text style={styles.accordionSub}>Styr när sektioner och ledtrådar öppnas</Text>
          </View>
          {expanded['installningar'] ? <ChevronUp size={16} color="#9A8E78" /> : <ChevronDown size={16} color="#9A8E78" />}
        </TouchableOpacity>
        {expanded['installningar'] ? (
          <View style={[styles.card, { gap: 0 }]}>
            <Text style={[styles.phaseLabel, { marginBottom: 4, paddingHorizontal: 2 }]}>Styr när sektionerna blir klickbara i appen</Text>

            {/* ---- INFÖR FESTEN ---- */}
            <TouchableOpacity
              onPress={() => setInstallInforOpen(v => !v)}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#EDE6D6', marginTop: 8 }}
            >
              <Text style={[styles.phaseLabel, { fontSize: 13, fontFamily: 'DMSans_700Bold', flex: 1 }]}>Inför festen</Text>
              {installInforOpen ? <ChevronUp size={16} color="#9A8E78" /> : <ChevronDown size={16} color="#9A8E78" />}
            </TouchableOpacity>

            {installInforOpen ? ([
              { label: 'STEG 1 — INTRESSEANMÄLAN PUBLICERAS', date: steg1UnlockDate, setDate: setSteg1UnlockDate },
              { label: 'STEG 2 — ANMÄLNINGSBEKRÄFTELSE PUBLICERAS', date: steg2UnlockDate, setDate: setSteg2UnlockDate },
              { label: 'STEG 3 — MITT LAG PUBLICERAS', date: lagUnlockDate, setDate: setLagUnlockDate },
              { label: 'STEG 4 — MITT VÄRDSKAP PUBLICERAS', date: vardinfoUnlockDate, setDate: setVardinfoUnlockDate },
              { label: 'STEG 5 — DAGS ATT BÖRJA FESTEN! PUBLICERAS', date: steg6UnlockDate, setDate: setSteg6UnlockDate },
              { label: 'ADRESS FÖRRÄTT PUBLICERAS (LÅNGT INNAN FESTDAGEN)', date: steg5UnlockDate, setDate: setSteg5UnlockDate },
            ] as { label: string; date: Date; setDate: (d: Date) => void }[]).map(({ label, date, setDate }) => {
              const y = date.getFullYear(), m = date.getMonth(), d = date.getDate();
              const h = date.getHours(), min = date.getMinutes();
              const MONTHS = ['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec'];
              const adj = (field: 'y'|'m'|'d'|'h'|'min', delta: number) => {
                const next = new Date(date);
                if (field === 'y') next.setFullYear(y + delta);
                if (field === 'm') next.setMonth(m + delta);
                if (field === 'd') next.setDate(d + delta);
                if (field === 'h') next.setHours(Math.max(0, Math.min(23, h + delta)));
                if (field === 'min') next.setMinutes(Math.max(0, Math.min(59, min + delta)));
                setDate(next);
              };
              const btnD = { width: 32, height: 32, borderRadius: 8, backgroundColor: '#E8E0CC', alignItems: 'center' as const, justifyContent: 'center' as const };
              const btnT2 = { width: 32, height: 32, borderRadius: 8, backgroundColor: '#C8B98A', alignItems: 'center' as const, justifyContent: 'center' as const };
              const btnTxt = { fontFamily: 'DMSans_700Bold', fontSize: 18, color: '#5A3800', lineHeight: 32 };
              const val = { fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: '#2A2A2A', textAlign: 'center' as const };
              return (
                <View key={label} style={{ paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#EDE6D6' }}>
                  <Text style={styles.formLabel}>{label}</Text>
                  {/* Datum-rad */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 }}>
                    <View style={{ width: 32, alignItems: 'center', gap: 4 }}>
                      <TouchableOpacity style={btnD} onPress={() => adj('d', 1)}><Text style={btnTxt}>+</Text></TouchableOpacity>
                      <Text style={[val, { width: 32 }]}>{d}</Text>
                      <TouchableOpacity style={btnD} onPress={() => adj('d', -1)}><Text style={btnTxt}>−</Text></TouchableOpacity>
                    </View>
                    <View style={{ width: 44, alignItems: 'center', gap: 4 }}>
                      <TouchableOpacity style={[btnD, { width: 44 }]} onPress={() => adj('m', 1)}><Text style={btnTxt}>+</Text></TouchableOpacity>
                      <Text style={[val, { width: 44 }]}>{MONTHS[m]}</Text>
                      <TouchableOpacity style={[btnD, { width: 44 }]} onPress={() => adj('m', -1)}><Text style={btnTxt}>−</Text></TouchableOpacity>
                    </View>
                    <View style={{ width: 56, alignItems: 'center', gap: 4 }}>
                      <TouchableOpacity style={[btnD, { width: 56 }]} onPress={() => adj('y', 1)}><Text style={btnTxt}>+</Text></TouchableOpacity>
                      <Text style={[val, { width: 56 }]}>{y}</Text>
                      <TouchableOpacity style={[btnD, { width: 56 }]} onPress={() => adj('y', -1)}><Text style={btnTxt}>−</Text></TouchableOpacity>
                    </View>
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#9A8E78', flex: 1 }}>
                      {isNaN(date.getTime()) ? '—' : date.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                    </Text>
                  </View>
                  {/* Klockslags-rad */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 }}>
                    <View style={{ width: 32, alignItems: 'center', gap: 4 }}>
                      <TouchableOpacity style={[btnT2, { width: 32 }]} onPress={() => adj('h', 1)}><Text style={btnTxt}>+</Text></TouchableOpacity>
                      <Text style={[val, { width: 32 }]}>{String(h).padStart(2,'0')}</Text>
                      <TouchableOpacity style={[btnT2, { width: 32 }]} onPress={() => adj('h', -1)}><Text style={btnTxt}>−</Text></TouchableOpacity>
                    </View>
                    <View style={{ width: 44, alignItems: 'center', gap: 4 }}>
                      <TouchableOpacity style={[btnT2, { width: 44 }]} onPress={() => adj('min', 5)}><Text style={btnTxt}>+</Text></TouchableOpacity>
                      <Text style={[val, { width: 44 }]}>{String(min).padStart(2,'0')}</Text>
                      <TouchableOpacity style={[btnT2, { width: 44 }]} onPress={() => adj('min', -5)}><Text style={btnTxt}>−</Text></TouchableOpacity>
                    </View>
                    <View style={{ width: 56 }} />
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#9A8E78', flex: 1 }}>
                      kl {String(h).padStart(2,'0')}:{String(min).padStart(2,'0')}
                    </Text>
                  </View>
                </View>
              );
            }): null}

            {/* ---- UNDER FESTEN ---- */}
            <TouchableOpacity
              onPress={() => setInstallUnderOpen(v => !v)}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#EDE6D6', marginTop: 8 }}
            >
              <Text style={[styles.phaseLabel, { fontSize: 13, fontFamily: 'DMSans_700Bold', flex: 1 }]}>Under festen</Text>
              {installUnderOpen ? <ChevronUp size={16} color="#9A8E78" /> : <ChevronDown size={16} color="#9A8E78" />}
            </TouchableOpacity>

            {installUnderOpen ? ([
              { label: 'ADRESS VARMRÄTT PUBLICERAS', date: steg7UnlockDate, setDate: setSteg7UnlockDate },
              { label: 'ADRESS EFTERRÄTT PUBLICERAS', date: steg8UnlockDate, setDate: setSteg8UnlockDate },
            ] as { label: string; date: Date; setDate: (d: Date) => void }[]).map(({ label, date, setDate }) => {
              const y = date.getFullYear(), m = date.getMonth(), d = date.getDate();
              const h = date.getHours(), min = date.getMinutes();
              const MONTHS = ['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec'];
              const adj = (field: 'y'|'m'|'d'|'h'|'min', delta: number) => {
                const next = new Date(date);
                if (field === 'y') next.setFullYear(y + delta);
                if (field === 'm') next.setMonth(m + delta);
                if (field === 'd') next.setDate(d + delta);
                if (field === 'h') next.setHours(Math.max(0, Math.min(23, h + delta)));
                if (field === 'min') next.setMinutes(Math.max(0, Math.min(59, min + delta)));
                setDate(next);
              };
              // Datum-knappar: samma beige som förut
              const btnD = { width: 32, height: 32, borderRadius: 8, backgroundColor: '#E8E0CC', alignItems: 'center' as const, justifyContent: 'center' as const };
              // Klockslags-knappar: mörkare varmt beige för tydlig UX-distinktion
              const btnT2 = { width: 32, height: 32, borderRadius: 8, backgroundColor: '#C8B98A', alignItems: 'center' as const, justifyContent: 'center' as const };
              const btnTxt = { fontFamily: 'DMSans_700Bold', fontSize: 18, color: '#5A3800', lineHeight: 32 };
              const val = { fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: '#2A2A2A', textAlign: 'center' as const };
              return (
                <View key={label} style={{ paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#EDE6D6' }}>
                  <Text style={styles.formLabel}>{label}</Text>
                  {/* Datum-rad */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 }}>
                    <View style={{ width: 32, alignItems: 'center', gap: 4 }}>
                      <TouchableOpacity style={btnD} onPress={() => adj('d', 1)}><Text style={btnTxt}>+</Text></TouchableOpacity>
                      <Text style={[val, { width: 32 }]}>{d}</Text>
                      <TouchableOpacity style={btnD} onPress={() => adj('d', -1)}><Text style={btnTxt}>−</Text></TouchableOpacity>
                    </View>
                    <View style={{ width: 44, alignItems: 'center', gap: 4 }}>
                      <TouchableOpacity style={[btnD, { width: 44 }]} onPress={() => adj('m', 1)}><Text style={btnTxt}>+</Text></TouchableOpacity>
                      <Text style={[val, { width: 44 }]}>{MONTHS[m]}</Text>
                      <TouchableOpacity style={[btnD, { width: 44 }]} onPress={() => adj('m', -1)}><Text style={btnTxt}>−</Text></TouchableOpacity>
                    </View>
                    <View style={{ width: 56, alignItems: 'center', gap: 4 }}>
                      <TouchableOpacity style={[btnD, { width: 56 }]} onPress={() => adj('y', 1)}><Text style={btnTxt}>+</Text></TouchableOpacity>
                      <Text style={[val, { width: 56 }]}>{y}</Text>
                      <TouchableOpacity style={[btnD, { width: 56 }]} onPress={() => adj('y', -1)}><Text style={btnTxt}>−</Text></TouchableOpacity>
                    </View>
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#9A8E78', flex: 1 }}>
                      {isNaN(date.getTime()) ? '—' : date.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                    </Text>
                  </View>
                  {/* Klockslags-rad — exakt linjerad under datum-rad */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 }}>
                    {/* Timme under dag-kolumnen (32px) */}
                    <View style={{ width: 32, alignItems: 'center', gap: 4 }}>
                      <TouchableOpacity style={[btnT2, { width: 32 }]} onPress={() => adj('h', 1)}><Text style={btnTxt}>+</Text></TouchableOpacity>
                      <Text style={[val, { width: 32 }]}>{String(h).padStart(2,'0')}</Text>
                      <TouchableOpacity style={[btnT2, { width: 32 }]} onPress={() => adj('h', -1)}><Text style={btnTxt}>−</Text></TouchableOpacity>
                    </View>
                    {/* Minut under månad-kolumnen (44px) */}
                    <View style={{ width: 44, alignItems: 'center', gap: 4 }}>
                      <TouchableOpacity style={[btnT2, { width: 44 }]} onPress={() => adj('min', 5)}><Text style={btnTxt}>+</Text></TouchableOpacity>
                      <Text style={[val, { width: 44 }]}>{String(min).padStart(2,'0')}</Text>
                      <TouchableOpacity style={[btnT2, { width: 44 }]} onPress={() => adj('min', -5)}><Text style={btnTxt}>−</Text></TouchableOpacity>
                    </View>
                    {/* Tom spacer under år-kolumnen */}
                    <View style={{ width: 56 }} />
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#9A8E78', flex: 1 }}>
                      kl {String(h).padStart(2,'0')}:{String(min).padStart(2,'0')}
                    </Text>
                  </View>
                </View>
              );
            }): null}

            {/* ---- LEDTRÅDAR ---- */}
            <TouchableOpacity
              onPress={() => setInstallLedtradOpen(v => !v)}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#EDE6D6', marginTop: 8 }}
            >
              <Text style={[styles.phaseLabel, { fontSize: 13, fontFamily: 'DMSans_700Bold', flex: 1 }]}>Ledtrådar</Text>
              {installLedtradOpen ? <ChevronUp size={16} color="#9A8E78" /> : <ChevronDown size={16} color="#9A8E78" />}
            </TouchableOpacity>

            {installLedtradOpen ? ([
              { label: 'LEDTRÅDAR FÖRRÄTT PUBLICERAS', date: ledtradForrattDate, setDate: setLedtradForrattDate },
              { label: 'LEDTRÅDAR VARMRÄTT PUBLICERAS', date: ledtradVarmrattDate, setDate: setLedtradVarmrattDate },
              { label: 'LEDTRÅDAR EFTERRÄTT PUBLICERAS', date: ledtradEfterrattDate, setDate: setLedtradEfterrattDate },
            ] as { label: string; date: Date; setDate: (d: Date) => void }[]).map(({ label, date, setDate }) => {
              const y = date.getFullYear(), m = date.getMonth(), d = date.getDate();
              const h = date.getHours(), min = date.getMinutes();
              const MONTHS = ['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec'];
              const adj = (field: 'y'|'m'|'d'|'h'|'min', delta: number) => {
                const next = new Date(date);
                if (field === 'y') next.setFullYear(y + delta);
                if (field === 'm') next.setMonth(m + delta);
                if (field === 'd') next.setDate(d + delta);
                if (field === 'h') next.setHours(Math.max(0, Math.min(23, h + delta)));
                if (field === 'min') next.setMinutes(Math.max(0, Math.min(59, min + delta)));
                setDate(next);
              };
              const btnD = { width: 32, height: 32, borderRadius: 8, backgroundColor: '#A8D5A2', alignItems: 'center' as const, justifyContent: 'center' as const };
              const btnT2 = { width: 32, height: 32, borderRadius: 8, backgroundColor: '#4A9E44', alignItems: 'center' as const, justifyContent: 'center' as const };
              const btnTxt = { fontFamily: 'DMSans_700Bold', fontSize: 18, color: '#fff', lineHeight: 32 };
              const val = { fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: '#2A2A2A', textAlign: 'center' as const };
              return (
                <View key={label} style={{ paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#EDE6D6' }}>
                  <Text style={styles.formLabel}>{label}</Text>
                  {/* Datum-rad */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 }}>
                    <View style={{ width: 32, alignItems: 'center', gap: 4 }}>
                      <TouchableOpacity style={btnD} onPress={() => adj('d', 1)}><Text style={btnTxt}>+</Text></TouchableOpacity>
                      <Text style={[val, { width: 32 }]}>{d}</Text>
                      <TouchableOpacity style={btnD} onPress={() => adj('d', -1)}><Text style={btnTxt}>−</Text></TouchableOpacity>
                    </View>
                    <View style={{ width: 44, alignItems: 'center', gap: 4 }}>
                      <TouchableOpacity style={[btnD, { width: 44 }]} onPress={() => adj('m', 1)}><Text style={btnTxt}>+</Text></TouchableOpacity>
                      <Text style={[val, { width: 44 }]}>{MONTHS[m]}</Text>
                      <TouchableOpacity style={[btnD, { width: 44 }]} onPress={() => adj('m', -1)}><Text style={btnTxt}>−</Text></TouchableOpacity>
                    </View>
                    <View style={{ width: 56, alignItems: 'center', gap: 4 }}>
                      <TouchableOpacity style={[btnD, { width: 56 }]} onPress={() => adj('y', 1)}><Text style={btnTxt}>+</Text></TouchableOpacity>
                      <Text style={[val, { width: 56 }]}>{y}</Text>
                      <TouchableOpacity style={[btnD, { width: 56 }]} onPress={() => adj('y', -1)}><Text style={btnTxt}>−</Text></TouchableOpacity>
                    </View>
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#9A8E78', flex: 1 }}>
                      {isNaN(date.getTime()) ? '—' : date.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                    </Text>
                  </View>
                  {/* Klockslags-rad */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 }}>
                    <View style={{ width: 32, alignItems: 'center', gap: 4 }}>
                      <TouchableOpacity style={[btnT2, { width: 32 }]} onPress={() => adj('h', 1)}><Text style={btnTxt}>+</Text></TouchableOpacity>
                      <Text style={[val, { width: 32 }]}>{String(h).padStart(2,'0')}</Text>
                      <TouchableOpacity style={[btnT2, { width: 32 }]} onPress={() => adj('h', -1)}><Text style={btnTxt}>−</Text></TouchableOpacity>
                    </View>
                    <View style={{ width: 44, alignItems: 'center', gap: 4 }}>
                      <TouchableOpacity style={[btnT2, { width: 44 }]} onPress={() => adj('min', 5)}><Text style={btnTxt}>+</Text></TouchableOpacity>
                      <Text style={[val, { width: 44 }]}>{String(min).padStart(2,'0')}</Text>
                      <TouchableOpacity style={[btnT2, { width: 44 }]} onPress={() => adj('min', -5)}><Text style={btnTxt}>−</Text></TouchableOpacity>
                    </View>
                    <View style={{ width: 56 }} />
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#9A8E78', flex: 1 }}>
                      kl {String(h).padStart(2,'0')}:{String(min).padStart(2,'0')}
                    </Text>
                  </View>
                </View>
              );
            }): null}

            {/* ---- EFTER FESTEN ---- */}
            <TouchableOpacity
              onPress={() => setInstallEfterOpen(v => !v)}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#EDE6D6', marginTop: 8 }}
            >
              <Text style={[styles.phaseLabel, { fontSize: 13, fontFamily: 'DMSans_700Bold', flex: 1 }]}>Efter festen</Text>
              {installEfterOpen ? <ChevronUp size={16} color="#9A8E78" /> : <ChevronDown size={16} color="#9A8E78" />}
            </TouchableOpacity>

            {installEfterOpen ? ([
              { label: 'ÅTERKOPPLING PUBLICERAS', date: aterkopplingUnlockDate, setDate: setAterkopplingUnlockDate },
            ] as { label: string; date: Date; setDate: (d: Date) => void }[]).map(({ label, date, setDate }) => {
              const y = date.getFullYear(), m = date.getMonth(), d = date.getDate();
              const h = date.getHours(), min = date.getMinutes();
              const MONTHS = ['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec'];
              const adj = (field: 'y'|'m'|'d'|'h'|'min', delta: number) => {
                const next = new Date(date);
                if (field === 'y') next.setFullYear(y + delta);
                if (field === 'm') next.setMonth(m + delta);
                if (field === 'd') next.setDate(d + delta);
                if (field === 'h') next.setHours(Math.max(0, Math.min(23, h + delta)));
                if (field === 'min') next.setMinutes(Math.max(0, Math.min(59, min + delta)));
                setDate(next);
              };
              const btnD = { width: 32, height: 32, borderRadius: 8, backgroundColor: '#E8E0CC', alignItems: 'center' as const, justifyContent: 'center' as const };
              const btnT2 = { width: 32, height: 32, borderRadius: 8, backgroundColor: '#C8B98A', alignItems: 'center' as const, justifyContent: 'center' as const };
              const btnTxt = { fontFamily: 'DMSans_700Bold', fontSize: 18, color: '#5A3800', lineHeight: 32 };
              const val = { fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: '#2A2A2A', textAlign: 'center' as const };
              return (
                <View key={label} style={{ paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#EDE6D6' }}>
                  <Text style={styles.formLabel}>{label}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 }}>
                    <View style={{ width: 32, alignItems: 'center', gap: 4 }}>
                      <TouchableOpacity style={btnD} onPress={() => adj('d', 1)}><Text style={btnTxt}>+</Text></TouchableOpacity>
                      <Text style={[val, { width: 32 }]}>{d}</Text>
                      <TouchableOpacity style={btnD} onPress={() => adj('d', -1)}><Text style={btnTxt}>−</Text></TouchableOpacity>
                    </View>
                    <View style={{ width: 44, alignItems: 'center', gap: 4 }}>
                      <TouchableOpacity style={[btnD, { width: 44 }]} onPress={() => adj('m', 1)}><Text style={btnTxt}>+</Text></TouchableOpacity>
                      <Text style={[val, { width: 44 }]}>{MONTHS[m]}</Text>
                      <TouchableOpacity style={[btnD, { width: 44 }]} onPress={() => adj('m', -1)}><Text style={btnTxt}>−</Text></TouchableOpacity>
                    </View>
                    <View style={{ width: 56, alignItems: 'center', gap: 4 }}>
                      <TouchableOpacity style={[btnD, { width: 56 }]} onPress={() => adj('y', 1)}><Text style={btnTxt}>+</Text></TouchableOpacity>
                      <Text style={[val, { width: 56 }]}>{y}</Text>
                      <TouchableOpacity style={[btnD, { width: 56 }]} onPress={() => adj('y', -1)}><Text style={btnTxt}>−</Text></TouchableOpacity>
                    </View>
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#9A8E78', flex: 1 }}>
                      {isNaN(date.getTime()) ? '—' : date.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 }}>
                    <View style={{ width: 32, alignItems: 'center', gap: 4 }}>
                      <TouchableOpacity style={[btnT2, { width: 32 }]} onPress={() => adj('h', 1)}><Text style={btnTxt}>+</Text></TouchableOpacity>
                      <Text style={[val, { width: 32 }]}>{String(h).padStart(2,'0')}</Text>
                      <TouchableOpacity style={[btnT2, { width: 32 }]} onPress={() => adj('h', -1)}><Text style={btnTxt}>−</Text></TouchableOpacity>
                    </View>
                    <View style={{ width: 44, alignItems: 'center', gap: 4 }}>
                      <TouchableOpacity style={[btnT2, { width: 44 }]} onPress={() => adj('min', 5)}><Text style={btnTxt}>+</Text></TouchableOpacity>
                      <Text style={[val, { width: 44 }]}>{String(min).padStart(2,'0')}</Text>
                      <TouchableOpacity style={[btnT2, { width: 44 }]} onPress={() => adj('min', -5)}><Text style={btnTxt}>−</Text></TouchableOpacity>
                    </View>
                    <View style={{ width: 56 }} />
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#9A8E78', flex: 1 }}>
                      kl {String(h).padStart(2,'0')}:{String(min).padStart(2,'0')}
                    </Text>
                  </View>
                </View>
              );
            }): null}

            {installEfterOpen ? (
              <TouchableOpacity
                style={{ backgroundColor: '#FFF5E0', borderWidth: 1, borderColor: '#C8B98A', borderRadius: 8, padding: 10, marginTop: 8, alignItems: 'center' }}
                onPress={async () => {
                  try {
                    await api.delete('/api/cykelfest/feedback/all');
                    await AsyncStorage.removeItem('aterkoppling_done');
                    Alert.alert('Återställt', 'Återkoppling återställd. Du kan nu testa igen.');
                    setFeedbackData([]);
                  } catch (e) {
                    console.error('[Admin] reset feedback failed:', e);
                    Alert.alert('Fel', 'Kunde inte återställa återkoppling.');
                  }
                }}
              >
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#5A3800' }}>Återställ återkoppling (testläge)</Text>
              </TouchableOpacity>
            ) : null}

            {/* Spara */}
            <TouchableOpacity
              style={{ backgroundColor: '#5A3800', borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 4 }}
              onPress={async () => {
                try {
                  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                  const fmtTime = (d: Date) => `${fmt(d)}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
                  await Promise.all([
                    api.post('/api/cykelfest/settings/unlock_steg1', { value: fmtTime(steg1UnlockDate) }),
                    api.post('/api/cykelfest/settings/unlock_steg2', { value: fmtTime(steg2UnlockDate) }),
                    api.post('/api/cykelfest/settings/unlock_ditt_lag', { value: fmtTime(lagUnlockDate) }),
                    api.post('/api/cykelfest/settings/unlock_vardinfo', { value: fmtTime(vardinfoUnlockDate) }),
                    api.post('/api/cykelfest/settings/unlock_steg5', { value: fmtTime(steg5UnlockDate) }),
                    api.post('/api/cykelfest/settings/unlock_steg6', { value: fmtTime(steg6UnlockDate) }),
                    api.post('/api/cykelfest/settings/unlock_steg7', { value: fmtTime(steg7UnlockDate) }),
                    api.post('/api/cykelfest/settings/unlock_steg8', { value: fmtTime(steg8UnlockDate) }),
                    api.post('/api/cykelfest/settings/unlock_aterkoppling', { value: fmtTime(aterkopplingUnlockDate) }),
                    api.post('/api/cykelfest/settings/unlock_ledtrad_forratt', { value: fmtTime(ledtradForrattDate) }),
                    api.post('/api/cykelfest/settings/unlock_ledtrad_varmratt', { value: fmtTime(ledtradVarmrattDate) }),
                    api.post('/api/cykelfest/settings/unlock_ledtrad_efterratt', { value: fmtTime(ledtradEfterrattDate) }),
                  ]);
                  setSettingsSaved(true);
                  setTimeout(() => setSettingsSaved(false), 2500);
                } catch {
                  Alert.alert('Fel', 'Kunde inte spara inställningar.');
                }
              }}
            >
              <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: '#fff' }}>{settingsSaved ? '✓ Sparat' : 'Spara tider'}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {/* IMPORT OCH EXPORT AV DATA */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.accordionHeader}
          onPress={() => setImportExportOpen(prev => !prev)}
        >
          <View style={styles.accordionLabelWrap}>
            <Text style={styles.accordionLabel}>IMPORT OCH EXPORT AV DATA</Text>
            <Text style={styles.accordionSub}>Hantera deltagardata och systemexporter</Text>
          </View>
          {importExportOpen ? <ChevronUp size={16} color="#9A8E78" /> : <ChevronDown size={16} color="#9A8E78" />}
        </TouchableOpacity>

        {importExportOpen ? (
          <View style={{ gap: 10 }}>
            {/* Importera deltagare */}
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setShowImportModal(true)}
            >
              <Text style={styles.addBtnText}>Importera data</Text>
            </TouchableOpacity>

            {/* Exportera data */}
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: '#1C4F4A', opacity: isExporting ? 0.7 : 1 }]}
              disabled={isExporting}
              onPress={async () => {
                try {
                  setIsExporting(true);
                  const url = `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/cykelfest/download-algoritm`;
                  if (Platform.OS === 'web') {
                    const response = await fetch(url);
                    const blob = await response.blob();
                    const disposition = response.headers.get('content-disposition') ?? '';
                    const match = disposition.match(/filename="?([^";\s]+)"?/);
                    const downloadName = match ? match[1] : 'cykelfest-export.xlsx';
                    // Try Web Share API first (supports share sheet on Safari/iOS)
                    if (navigator.canShare && navigator.canShare({ files: [new File([blob], downloadName, { type: blob.type })] })) {
                      const file = new File([blob], downloadName, { type: blob.type });
                      await navigator.share({ files: [file], title: downloadName });
                    } else {
                      // Fallback: trigger browser download
                      const blobUrl = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = blobUrl;
                      a.download = downloadName;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      window.URL.revokeObjectURL(blobUrl);
                    }
                  } else {
                    const response = await fetch(url);
                    const disposition = response.headers.get('content-disposition') ?? '';
                    const match = disposition.match(/filename="?([^";\s]+)"?/);
                    const filename = match ? match[1] : 'cykelfest-export.xlsx';
                    const localUri = (FileSystem.documentDirectory ?? '') + filename;
                    const { uri } = await FileSystem.downloadAsync(url, localUri);
                    await Sharing.shareAsync(uri, {
                      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                      dialogTitle: 'Dela exportfil',
                      UTI: 'com.microsoft.excel.xlsx',
                    });
                  }
                } catch (e: any) {
                  if (e?.name !== 'AbortError') {
                    Alert.alert('Fel', 'Kunde inte exportera data. Försök igen.');
                  }
                } finally {
                  setIsExporting(false);
                }
              }}
            >
              {isExporting ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.addBtnText}>Exporterar...</Text>
                </View>
              ) : (
                <Text style={styles.addBtnText}>Exportera data</Text>
              )}
            </TouchableOpacity>

            {/* Import Modal */}
            <Modal
              visible={showImportModal}
              transparent
              animationType="fade"
              onRequestClose={() => { setShowImportModal(false); setImportResult(null); setImportFile(null); }}
            >
              <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '100%' }}>
                  <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 480 }} contentContainerStyle={{ gap: 12 }}>
                    {importResult && importResult.imported > 0 ? (
                      /* Success state */
                      <>
                        <View style={{ backgroundColor: '#F0FAF4', borderRadius: 14, paddingVertical: 28, alignItems: 'center', gap: 10 }}>
                          <Text style={{ fontSize: 48 }}>✅</Text>
                          <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 28, color: '#1C4A30', textAlign: 'center' }}>Klart!</Text>
                        </View>
                        <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 16, color: '#2A7A4A', textAlign: 'center' }}>
                          {importResult.imported}{' deltagare importerades'}
                        </Text>
                        {importResult.errors.length > 0 ? (
                          <View style={{ gap: 4 }}>
                            {importResult.errors.map((err, i) => (
                              <Text key={i} style={{ fontFamily: 'SpaceMono_400Regular', fontSize: 11, color: '#C0392B' }}>
                                {err}
                              </Text>
                            ))}
                          </View>
                        ) : null}
                        <TouchableOpacity
                          style={{ backgroundColor: '#1C3A2A', height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', width: '100%' }}
                          onPress={() => { setShowImportModal(false); setImportResult(null); setImportFile(null); }}
                        >
                          <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 17, color: '#fff' }}>Stäng</Text>
                        </TouchableOpacity>
                      </>
                    ) : importResult && importResult.imported === 0 ? (
                      /* Error-only state */
                      <>
                        <Text style={[styles.phaseLabel, { fontSize: 16, marginBottom: 0 }]}>Importera data</Text>
                        <TouchableOpacity
                          style={styles.addBtn}
                          onPress={() => Linking.openURL(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/cykelfest/import/template`)}
                        >
                          <Text style={styles.addBtnText}>⬇ Ladda ner Excel-mall</Text>
                        </TouchableOpacity>
                        {/* File picker dropzone */}
                        <TouchableOpacity
                          onPress={async () => {
                            const result = await DocumentPicker.getDocumentAsync({
                              type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', '*/*'],
                              copyToCacheDirectory: true,
                            });
                            if (!result.canceled && result.assets?.[0]) {
                              setImportFile({ uri: result.assets[0].uri, name: result.assets[0].name });
                            }
                          }}
                          style={{
                            borderWidth: 2,
                            borderColor: importFile ? '#2A7A4A' : '#C8BEA8',
                            borderStyle: 'dashed',
                            borderRadius: 10,
                            padding: 20,
                            alignItems: 'center',
                            gap: 8,
                            backgroundColor: importFile ? '#F0FAF4' : '#FDFAF5',
                          }}
                        >
                          <Text style={{ fontSize: 28 }}>{importFile ? '📊' : '📂'}</Text>
                          <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: importFile ? '#2A7A4A' : '#6A6055', textAlign: 'center' }}>
                            {importFile ? importFile.name : 'Tryck för att välja Excel-fil'}
                          </Text>
                          {!importFile ? (
                            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#9A8E78', textAlign: 'center' }}>
                              .xlsx-format
                            </Text>
                          ) : null}
                        </TouchableOpacity>
                        {/* Importera button */}
                        <TouchableOpacity
                          style={[styles.adminBtn, (!importFile || importLoading) ? { opacity: 0.5 } : null]}
                          onPress={handleImportXlsx}
                          disabled={!importFile || importLoading}
                        >
                          <Text style={styles.adminBtnText}>{importLoading ? 'Importerar...' : 'Importera'}</Text>
                        </TouchableOpacity>
                        <View style={{ gap: 4 }}>
                          {importResult.errors.map((err, i) => (
                            <Text key={i} style={{ fontFamily: 'SpaceMono_400Regular', fontSize: 11, color: '#C0392B' }}>
                              {err}
                            </Text>
                          ))}
                        </View>
                        <TouchableOpacity
                          style={{ backgroundColor: '#3A2A1C', height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center', width: '100%' }}
                          onPress={() => { setShowImportModal(false); setImportResult(null); setImportFile(null); }}
                        >
                          <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 16, color: '#fff' }}>Stäng</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      /* Default state — no result yet */
                      <>
                        <Text style={[styles.phaseLabel, { fontSize: 16, marginBottom: 0 }]}>Importera data</Text>
                        <TouchableOpacity
                          style={styles.addBtn}
                          onPress={() => Linking.openURL(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/cykelfest/import/template`)}
                        >
                          <Text style={styles.addBtnText}>⬇ Ladda ner Excel-mall</Text>
                        </TouchableOpacity>
                        {/* File picker dropzone */}
                        <TouchableOpacity
                          onPress={async () => {
                            const result = await DocumentPicker.getDocumentAsync({
                              type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', '*/*'],
                              copyToCacheDirectory: true,
                            });
                            if (!result.canceled && result.assets?.[0]) {
                              setImportFile({ uri: result.assets[0].uri, name: result.assets[0].name });
                            }
                          }}
                          style={{
                            borderWidth: 2,
                            borderColor: importFile ? '#2A7A4A' : '#C8BEA8',
                            borderStyle: 'dashed',
                            borderRadius: 10,
                            padding: 20,
                            alignItems: 'center',
                            gap: 8,
                            backgroundColor: importFile ? '#F0FAF4' : '#FDFAF5',
                          }}
                        >
                          <Text style={{ fontSize: 28 }}>{importFile ? '📊' : '📂'}</Text>
                          <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: importFile ? '#2A7A4A' : '#6A6055', textAlign: 'center' }}>
                            {importFile ? importFile.name : 'Tryck för att välja Excel-fil'}
                          </Text>
                          {!importFile ? (
                            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#9A8E78', textAlign: 'center' }}>
                              .xlsx-format
                            </Text>
                          ) : null}
                        </TouchableOpacity>
                        {/* Importera button */}
                        <TouchableOpacity
                          style={[styles.adminBtn, (!importFile || importLoading) ? { opacity: 0.5 } : null]}
                          onPress={handleImportXlsx}
                          disabled={!importFile || importLoading}
                        >
                          <Text style={styles.adminBtnText}>{importLoading ? 'Importerar...' : 'Importera'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{ backgroundColor: '#EDE8DC', height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', width: '100%' }}
                          onPress={() => { setShowImportModal(false); setImportResult(null); setImportFile(null); }}
                        >
                          <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: '#5A4E3A' }}>Stäng</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </ScrollView>
                </View>
              </View>
            </Modal>
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.accordionHeader}
          onPress={() => {
            const next = !statsOpen;
            setStatsOpen(next);
            if (next) loadStats();
          }}
        >
          <View style={styles.accordionLabelWrap}>
            <Text style={[styles.accordionLabel, { color: '#1C4F4A' }]}>STATISTIK</Text>
            <Text style={styles.accordionSub}>Aktuell statistik för hela evenemanget</Text>
          </View>
          {statsOpen ? <ChevronUp size={16} color="#1C4F4A" /> : <ChevronDown size={16} color="#1C4F4A" />}
        </TouchableOpacity>

        {statsOpen ? (
          <View style={{ gap: 0 }}>
            {/* Refresh */}
            <TouchableOpacity
              onPress={loadStats}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6, paddingVertical: 8, paddingHorizontal: 16 }}
            >
              <Text style={{ fontFamily: 'SpaceMono_400Regular', fontSize: 9, letterSpacing: 1.5, color: '#1C4F4A' }}>↻ UPPDATERA</Text>
            </TouchableOpacity>

            {statsLoading || !stats ? (
              <View style={{ alignItems: 'center', padding: 32 }}>
                <ActivityIndicator color="#1C4F4A" />
              </View>
            ) : (
              <View style={{ gap: 16, paddingHorizontal: 16, paddingBottom: 16 }}>

                {/* HERO ROW — confirmation rate */}
                <View style={{ backgroundColor: '#0F3330', borderRadius: 16, padding: 20, gap: 4 }}>
                  <Text style={{ fontFamily: 'SpaceMono_400Regular', fontSize: 9, letterSpacing: 2, color: '#6BBFB0', marginBottom: 8 }}>DELTAGARE — BEKRÄFTELSESTATUS</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
                    <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 52, color: '#fff', lineHeight: 56 }}>{stats.deltagare.bekraftade}</Text>
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 18, color: 'rgba(255,255,255,0.45)', marginBottom: 10 }}>/ {stats.deltagare.totalt}</Text>
                  </View>
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: '#A8D4C8' }}>
                    {stats.deltagare.totalt > 0 ? Math.round((stats.deltagare.bekraftade / stats.deltagare.totalt) * 100) : 0}% bekräftade
                  </Text>
                  {/* Progress bar */}
                  {stats.deltagare.totalt > 0 ? (
                    <View style={{ height: 5, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 3, overflow: 'hidden', marginTop: 12 }}>
                      <View style={{ height: 5, borderRadius: 3, backgroundColor: '#3DD68C', width: `${Math.round((stats.deltagare.bekraftade / stats.deltagare.totalt) * 100)}%` as any }} />
                    </View>
                  ) : null}
                </View>

                {/* ACTION NEEDED — unconfirmed */}
                {stats.deltagare.obekraftade > 0 ? (
                  <View style={{ backgroundColor: '#FFF8F0', borderRadius: 12, padding: 14, borderLeftWidth: 4, borderLeftColor: '#E8890C', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Text style={{ fontSize: 22 }}>⚠️</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 13, color: '#7A4500' }}>{stats.deltagare.obekraftade} ej bekräftade</Text>
                      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: '#B07040', marginTop: 1 }}>Deltagare saknar bekräftelse</Text>
                    </View>
                    <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 22, color: '#E8890C' }}>{stats.deltagare.obekraftade}</Text>
                  </View>
                ) : (
                  <View style={{ backgroundColor: '#F0FAF5', borderRadius: 12, padding: 14, borderLeftWidth: 4, borderLeftColor: '#3DD68C', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Text style={{ fontSize: 22 }}>✓</Text>
                    <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: '#1A6040' }}>Alla deltagare är bekräftade</Text>
                  </View>
                )}

                {/* KPI GRID */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {[
                    { label: 'Totalt', value: stats.deltagare.totalt, color: '#1C4F4A', bg: '#EAF5F2' },
                    { label: 'Värdar', value: stats.deltagare.vardar, color: '#5A3800', bg: '#FFF5E0' },
                    { label: 'Gäster', value: stats.deltagare.gaster, color: '#2A5FA8', bg: '#EEF4FF' },
                    { label: 'Allergier', value: stats.deltagare.medAllergier, color: stats.deltagare.medAllergier > 0 ? '#C0392B' : '#9A8E78', bg: stats.deltagare.medAllergier > 0 ? '#FFF0EE' : '#F5F0E8' },
                    { label: 'Med telefon', value: stats.deltagare.medTelefon, color: '#3A3228', bg: '#F5F0E8' },
                    { label: 'Lag', value: stats.lag.totalt, color: '#2A5FA8', bg: '#EEF4FF' },
                  ].map(({ label, value, color, bg }) => (
                    <View key={label} style={{ backgroundColor: bg, borderRadius: 12, padding: 14, alignItems: 'center', flex: 1, minWidth: 80 }}>
                      <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 28, color, lineHeight: 32 }}>{value}</Text>
                      <Text style={{ fontFamily: 'SpaceMono_400Regular', fontSize: 8, color: '#9A8E78', marginTop: 4, letterSpacing: 0.5 }}>{label.toUpperCase()}</Text>
                    </View>
                  ))}
                </View>

                {/* VÄRDSKAP CARD */}
                <View style={{ backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#EDE6D6' }}>
                  <View style={{ backgroundColor: '#FBF5E8', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#EDE6D6', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 3, height: 16, backgroundColor: '#C8A84B', borderRadius: 2 }} />
                    <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 11, letterSpacing: 1.5, color: '#7A5200' }}>VÄRDSKAP</Text>
                  </View>
                  <View style={{ paddingHorizontal: 16 }}>
                    {[
                      { label: 'Värdpar totalt', value: stats.vardskap.totalt, pct: null },
                      { label: 'Med adress', value: stats.vardskap.medAdress, pct: stats.vardskap.totalt > 0 ? Math.round((stats.vardskap.medAdress / stats.vardskap.totalt) * 100) : null },
                      { label: 'Med gästinfo', value: stats.vardskap.medGastinfo, pct: stats.vardskap.totalt > 0 ? Math.round((stats.vardskap.medGastinfo / stats.vardskap.totalt) * 100) : null },
                      { label: 'Tilldelade gäster', value: stats.vardskap.totalGaster, pct: null },
                    ].map(({ label, value, pct }, idx, arr) => (
                      <View key={label} style={{ paddingVertical: 12, borderBottomWidth: idx < arr.length - 1 ? 1 : 0, borderBottomColor: '#F5F0E8', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: '#6A5E50', flex: 1 }}>{label}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          {pct !== null ? <Text style={{ fontFamily: 'SpaceMono_400Regular', fontSize: 10, color: '#B0A898' }}>{pct}%</Text> : null}
                          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 18, color: '#5A3800', minWidth: 28, textAlign: 'right' }}>{value}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>

                {/* AKTIVITET CARD — frågor + omröstningar */}
                <View style={{ backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#EDE6D6' }}>
                  <View style={{ backgroundColor: '#EEF4FF', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#D8E6F8', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 3, height: 16, backgroundColor: '#2A5FA8', borderRadius: 2 }} />
                    <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 11, letterSpacing: 1.5, color: '#1A3A78' }}>AKTIVITET</Text>
                  </View>
                  <View style={{ paddingHorizontal: 16 }}>
                    {[
                      { label: 'Skapade frågor', value: stats.fragor.totalt, sub: `${stats.fragor.besvarade} besvarade` },
                      { label: 'Aktiva omröstningar', value: stats.omrostningar.totalt, sub: `${stats.omrostningar.totalRoster} röster totalt` },
                    ].map(({ label, value, sub }, idx) => (
                      <View key={label} style={{ paddingVertical: 12, borderBottomWidth: idx === 0 ? 1 : 0, borderBottomColor: '#F5F0E8', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ gap: 2 }}>
                          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: '#6A5E50' }}>{label}</Text>
                          <Text style={{ fontFamily: 'SpaceMono_400Regular', fontSize: 9, color: '#B0A898' }}>{sub}</Text>
                        </View>
                        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 18, color: '#2A5FA8' }}>{value}</Text>
                      </View>
                    ))}
                  </View>
                </View>

              </View>
            )}
          </View>
        ) : null}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E5DFD1' },
  content: { paddingBottom: 20 },
  loginHeader: {
    paddingTop: 64,
    paddingBottom: 32,
    paddingHorizontal: 22,
  },
  loginEyebrow: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 9,
    letterSpacing: 2,
    color: 'rgba(255,100,100,0.6)',
    marginBottom: 6,
    marginTop: 12,
  },
  loginTitle: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 40,
    color: '#F5EFE0',
  },
  loginSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  loginContent: { flex: 1, padding: 20 },
  loginCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#E8E0CC',
    gap: 12,
  },
  loginLabel: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 9.5,
    color: '#9A8E78',
    letterSpacing: 1,
  },
  loginInput: {
    backgroundColor: '#F5EFE0',
    borderRadius: 10,
    padding: 14,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#E8E0CC',
  },
  loginBtn: { borderRadius: 12, overflow: 'hidden' },
  loginBtnGrad: { padding: 16, alignItems: 'center', borderRadius: 12 },
  loginBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    color: '#F4A4A4',
  },
  header: {
    paddingTop: 64,
    paddingBottom: 24,
    paddingHorizontal: 22,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(168,212,184,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(168,212,184,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  headerEyebrow: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 11,
    letterSpacing: 2,
    color: 'rgba(168,212,184,0.75)',
    marginBottom: 6,
  },
  headerTitle: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 36,
    color: '#F5EFE0',
  },
  headerSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  section: { marginHorizontal: 16, marginTop: 16 },
  sectionLabel: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 9.3,
    color: '#9A8E78',
    letterSpacing: 1,
    marginBottom: 8,
  },
  sectionBanner: {
    marginHorizontal: 0,
    marginBottom: 8,
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#1C4F4A',
    borderRadius: 10,
  },
  sectionBannerText: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 10,
    letterSpacing: 2,
    color: '#A8D4B8',
  },
  sectionLabelRed: {
    color: '#C0392B',
  },
  teamChip: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginRight: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E0CC',
    minWidth: 80,
  },
  teamChipEmoji: { fontSize: 20, marginBottom: 4 },
  teamChipName: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 10.5,
    color: '#2A2A2A',
    textAlign: 'center',
  },
  teamChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#A8D4B8',
    marginTop: 6,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E8E0CC',
    overflow: 'hidden',
    padding: 14,
    gap: 10,
  },
  phaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  phaseIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseIconActive: { backgroundColor: '#DFF0E8' },
  phaseIconLocked: { backgroundColor: '#F0EAD8' },
  phaseInfo: { flex: 1 },
  phaseLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: '#2A2A2A',
  },
  phaseDesc: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: '#7A7060',
    marginTop: 2,
  },
  phaseBtn: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1.5,
  },
  phaseBtnActive: {
    backgroundColor: '#DFF0E8',
    borderColor: '#A8D4B8',
  },
  phaseBtnLocked: {
    backgroundColor: '#1C4F4A',
    borderColor: '#1C4F4A',
  },
  phaseBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11.5,
    color: '#A8D4B8',
  },
  phaseBtnTextActive: {
    color: '#9A8E78',
  },
  phaseDivider: { height: 1, backgroundColor: '#F0EAD8' },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#E8E0CC',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  typeBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    backgroundColor: '#F5EFE0',
    borderWidth: 1,
    borderColor: '#E8E0CC',
  },
  typeBtnActive: {
    backgroundColor: '#1C4F4A',
    borderColor: '#1C4F4A',
  },
  typeBtnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    color: '#7A7060',
  },
  typeBtnTextActive: {
    color: '#A8D4B8',
  },
  publishBtn: {
    backgroundColor: '#1C4F4A',
    borderRadius: 10,
    padding: 13,
    alignItems: 'center',
  },
  publishBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: '#A8D4B8',
  },
  emergencyCard: {
    backgroundColor: '#FFF0F0',
    borderColor: '#F4C4C4',
  },
  emergencyInput: {
    backgroundColor: '#FFF8F8',
    borderColor: '#F4C4C4',
    color: '#8B1A1A',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  emergencyBtn: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  emergencyBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 10,
  },
  emergencyBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: '#fff',
  },
  emptyText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: '#9A8E78',
    textAlign: 'center',
    paddingVertical: 8,
  },
  questionAdminItem: {
    paddingVertical: 10,
    gap: 8,
  },
  questionAdminText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: '#2A2A2A',
    lineHeight: 18,
  },
  questionAdminAnswered: {
    backgroundColor: '#F5F1E8',
    borderRadius: 8,
    padding: 10,
    gap: 3,
  },
  questionAdminAnsweredLabel: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 8.5,
    color: '#9A8E78',
    letterSpacing: 0.3,
  },
  questionAdminAnsweredText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: '#2A2A2A',
    lineHeight: 18,
  },
  questionAdminInputRow: {
    gap: 8,
  },
  questionAdminInput: {
    backgroundColor: '#F5EFE0',
    borderRadius: 10,
    padding: 12,
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#E8E0CC',
    minHeight: 70,
    textAlignVertical: 'top',
  },
  quizPollItem: {
    paddingVertical: 10,
    gap: 6,
  },
  quizPollHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  quizPollIndex: {
    fontFamily: 'SpaceMono_700Bold',
    fontSize: 11,
    color: '#9A8E78',
    minWidth: 18,
    marginTop: 1,
  },
  quizPollQuestion: {
    flex: 1,
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: '#2A2A2A',
    lineHeight: 18,
  },
  quizEditBtn: {
    backgroundColor: '#F0EAD8',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  quizEditBtnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    color: '#7A7060',
  },
  quizEditForm: {
    gap: 8,
    marginTop: 4,
  },
  quizOptionsList: {
    gap: 3,
    paddingLeft: 26,
  },
  quizOptionText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: '#7A7060',
  },
  quizOptionCorrect: {
    color: '#1C6B3A',
    fontFamily: 'DMSans_600SemiBold',
  },
  quizStatsRow: {
    backgroundColor: '#F5F1E8',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 2,
  },
  quizStatText: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 10,
    color: '#7A7060',
    letterSpacing: 0.3,
  },
  correctAnswerLabel: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 9,
    color: '#9A8E78',
    letterSpacing: 1,
  },
  correctAnswerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  correctAnswerBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#F0EAD8',
    borderWidth: 1.5,
    borderColor: '#E8E0CC',
  },
  correctAnswerBtnActive: {
    backgroundColor: '#1C4F4A',
    borderColor: '#1C4F4A',
  },
  correctAnswerBtnText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
    color: '#7A7060',
  },
  correctAnswerBtnTextActive: {
    color: '#A8D4B8',
  },
  // Mitt värdskap styles
  adminSection: { marginHorizontal: 16, marginTop: 16 },
  adminSectionTitle: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 9.3,
    color: '#9A8E78',
    letterSpacing: 1,
    marginBottom: 8,
  },
  adminCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E8E0CC',
    overflow: 'hidden',
    padding: 14,
    marginBottom: 8,
  },
  adminBtn: {
    backgroundColor: '#1C4F4A',
    borderRadius: 10,
    padding: 13,
    alignItems: 'center',
  },
  adminBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: '#A8D4B8',
  },
  adminBtnSecondary: {
    borderRadius: 10,
    padding: 13,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E8E0CC',
  },
  adminBtnSecondaryText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: '#7A7060',
    textAlign: 'center',
  },
  hostCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 4 },
  hostCardName: { fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: '#1C1C1C' },
  hostCardMeta: { fontFamily: 'SpaceMono_400Regular', fontSize: 9.5, color: '#9A8E78', marginTop: 2 },
  hostGuestList: { fontFamily: 'DMSans_400Regular', fontSize: 11.5, color: '#7A7060', marginBottom: 8, lineHeight: 16 },
  editBtn: { backgroundColor: '#EAE4F5', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10 },
  editBtnText: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: '#1A3A6B' },
  deleteBtn: { alignSelf: 'flex-start', marginTop: 0, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: '#FDECEA', borderRadius: 8 },
  deleteBtnText: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: '#C0392B' },
  formInput: { backgroundColor: '#F5EFE0', borderRadius: 8, padding: 10, fontFamily: 'DMSans_400Regular', fontSize: 13, color: '#2A2A2A', borderWidth: 1, borderColor: '#E8E0CC' },
  formLabel: { fontFamily: 'SpaceMono_400Regular', fontSize: 9, color: '#9A8E78', letterSpacing: 0.8 },
  guestPickerList: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#E8E0CC', overflow: 'hidden' },
  guestPickerItem: { paddingHorizontal: 12, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F0EAD8' },
  guestPickerItemSelected: { backgroundColor: '#EAF4ED' },
  guestPickerText: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: '#2A2A2A', flex: 1 },
  guestPickerTextSelected: { fontFamily: 'DMSans_600SemiBold', color: '#1C4F4A' },
  guestPickerCheck: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: '#1C4F4A' },
  addBtn: { backgroundColor: '#1A3A6B', borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 10 },
  addBtnText: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: '#fff' },
  placeholderCard: { backgroundColor: '#F5F1E8', borderColor: '#E8E0CC' },
  placeholderText: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#B0A898', fontStyle: 'italic', textAlign: 'center', paddingVertical: 6 },
  accordionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, paddingHorizontal: 2, marginBottom: 2,
  },
  accordionLabel: {
    fontFamily: 'SpaceMono_400Regular', fontSize: 11.5, color: '#3A3228', letterSpacing: 0.8,
  },
  accordionLabelWrap: {
    flex: 1,
  },
  accordionSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: '#9A8E78',
    marginTop: 2,
  },
  groupDividerInfor: {
    backgroundColor: '#1C2E2A',
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginTop: 20,
  },
  groupDividerUnder: {
    backgroundColor: '#2E1C1C',
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginTop: 20,
  },
  groupDividerEfter: {
    backgroundColor: '#1C1C2E',
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginTop: 20,
  },
  groupDividerLabel: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 13,
    letterSpacing: 2,
    color: '#F5EFE0',
  },
  groupDividerSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 3,
  },
  // Team assignment styles
  teamCountBadge: {
    backgroundColor: '#E8E0CC',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 22,
    alignItems: 'center',
  },
  teamCountText: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 10,
    color: '#7A7060',
  },
  createTeamBtn: {
    backgroundColor: '#1A3A6B',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  createTeamBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
    color: '#fff',
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EAD8',
  },
  participantName: {
    flex: 1,
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: '#2A2A2A',
  },
  removeBtn: {
    backgroundColor: '#FDECEA',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  removeBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
    color: '#C0392B',
  },
  hiddenInput: { position: 'absolute', opacity: 0, width: 1, height: 1 },
  pinRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, paddingVertical: 4 },
  pinBox: {
    width: 56, height: 56, borderRadius: 12, borderWidth: 2,
    borderColor: '#E8E0CC', backgroundColor: '#F5EFE0',
    alignItems: 'center', justifyContent: 'center',
  },
  pinBoxFilled: { backgroundColor: '#F5E0E0', borderColor: '#8B1A1A' },
  pinBoxActive: {
    borderColor: '#8B1A1A', backgroundColor: '#fff',
    shadowColor: '#8B1A1A', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18, shadowRadius: 6, elevation: 3,
  },
  pinBoxError: { borderColor: '#E05555', backgroundColor: '#FFF0F0' },
  pinDigit: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 26, color: '#8B1A1A' },
  pinDigitError: { color: '#E05555' },
  errorText: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#E05555', textAlign: 'center', marginTop: -4 },
  loginBtnDisabled: { opacity: 0.6 },
});
