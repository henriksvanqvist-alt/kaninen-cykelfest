import { create } from 'zustand';

export type Phase = {
  id: string;
  name: string;
  label: string;
  unlockTime: string | null;
  unlockedAt: string | null;
  orderIndex: number;
};

export type Team = {
  id: string;
  name: string;
  theme: string | null;
  hostAddress: string | null;
  color: string | null;
  participants?: Participant[];
  scores?: Score[];
};

export type Participant = {
  id: string;
  name: string;
  teamId: string | null;
  role: string;
  phone: string | null;
  accessCode: string;
  team?: Team | null;
};

export type NewsItem = {
  id: string;
  title: string;
  body: string;
  type: string;
  createdAt: string;
};

export type Video = {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  isNew: boolean;
  publishedAt: string;
};

export type Poll = {
  id: string;
  question: string;
  options: string; // JSON string
  correctAnswer: number | null;
  closesAt: string | null;
  createdAt: string;
  votes?: PollVote[];
};

export type PollVote = {
  id: string;
  pollId: string;
  participantId: string;
  optionIndex: number;
};

export type Score = {
  id: string;
  teamId: string;
  phaseId: string | null;
  points: number;
  reason: string | null;
  awardedAt: string;
  team?: Team;
};

export type TeamArrival = {
  id: string;
  teamId: string;
  phaseId: string;
  arrivedAt: string | null;
  departedAt: string | null;
  hostNote: string | null;
  team?: Team;
  phase?: Phase;
};

export type ProgramStopData = {
  id: string;
  description?: string;
  rules?: string;
  scoring?: string;
};

interface AppState {
  participant: Participant | null;
  phases: Phase[];
  teams: Team[];
  news: NewsItem[];
  videos: Video[];
  polls: Poll[];
  scores: Score[];
  arrivals: TeamArrival[];
  settings: Record<string, string>;
  programStops: Record<string, ProgramStopData>;
  isLoading: boolean;
  lastFetched: number | null;

  scoresLastUpdated: number | null;

  setParticipant: (p: Participant | null) => void;
  setPhases: (phases: Phase[]) => void;
  setTeams: (teams: Team[]) => void;
  setNews: (news: NewsItem[]) => void;
  setVideos: (videos: Video[]) => void;
  setPolls: (polls: Poll[]) => void;
  setScores: (scores: Score[]) => void;
  setArrivals: (arrivals: TeamArrival[]) => void;
  setSettings: (settings: Record<string, string>) => void;
  setProgramStops: (stops: Record<string, ProgramStopData>) => void;
  setLoading: (loading: boolean) => void;
  setLastFetched: (ts: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  participant: null,
  phases: [],
  teams: [],
  news: [],
  videos: [],
  polls: [],
  scores: [],
  arrivals: [],
  settings: {},
  programStops: {},
  isLoading: false,
  lastFetched: null,
  scoresLastUpdated: null,

  setParticipant: (participant) => set({ participant }),
  setPhases: (phases) => set({ phases }),
  setTeams: (teams) => set({ teams }),
  setNews: (news) => set({ news }),
  setVideos: (videos) => set({ videos }),
  setPolls: (polls) => set({ polls }),
  setScores: (scores) => set((state) => ({
    scores,
    scoresLastUpdated: scores.length > 0 ? Date.now() : state.scoresLastUpdated,
  })),
  setArrivals: (arrivals) => set({ arrivals }),
  setSettings: (settings) => set({ settings }),
  setProgramStops: (programStops) => set({ programStops }),
  setLoading: (isLoading) => set({ isLoading }),
  setLastFetched: (lastFetched) => set({ lastFetched }),
}));
