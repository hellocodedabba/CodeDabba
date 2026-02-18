"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { NavBar } from "@/components/landing/NavBar";
import { useAuth } from "@/context/AuthProvider";
import { Loader2, Calendar, Users, ListChecks, ArrowLeft, Trophy, Clock, Github, Video, FileArchive, MessageCircle, X, Check, Mail, UserPlus, ShieldAlert } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "react-hot-toast";
import Link from "next/link";

interface Round {
    roundNumber: number;
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    isElimination: boolean;
    weightagePercentage: number;
    allowZip: boolean;
    allowGithub: boolean;
    allowVideo: boolean;
    allowDescription: boolean;
}

interface Hackathon {
    id: string;
    title: string;
    description: string;
    bannerUrl?: string;
    rules?: string;
    evaluationCriteria?: string;
    registrationStart: string;
    registrationEnd: string;
    startDate: string;
    endDate: string;
    maxTeamSize: number;
    maxParticipants?: number;
    allowIndividual: boolean;
    allowTeam: boolean;
    status: string;
    rounds: Round[];
    userRegistration?: {
        id: string;
        registrationType: 'individual' | 'team';
        isTeamLead: boolean;
        teamId?: string;
        teamName?: string;
        teamStatus?: string;
        rejectReason?: string;
    };
}

export default function HackathonDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [hackathon, setHackathon] = useState<Hackathon | null>(null);
    const [loading, setLoading] = useState(true);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [regType, setRegType] = useState<'individual' | 'team'>('individual');
    const [teamName, setTeamName] = useState('');
    const [members, setMembers] = useState<any[]>([]);
    const [memberName, setMemberName] = useState("");
    const [memberEmail, setMemberEmail] = useState("");
    const [memberMobile, setMemberMobile] = useState("");
    const [memberIsStudying, setMemberIsStudying] = useState(true);
    const [memberCollegeEmail, setMemberCollegeEmail] = useState("");
    const [memberHighestQualification, setMemberHighestQualification] = useState("");
    const [name, setName] = useState(user?.name || "");
    const [mobile, setMobile] = useState("");
    const [isStudying, setIsStudying] = useState(true);
    const [collegeEmail, setCollegeEmail] = useState("");
    const [highestQualification, setHighestQualification] = useState("");
    const [registering, setRegistering] = useState(false);

    useEffect(() => {
        if (user) {
            if (!name) setName(user.name || "");
        }
    }, [user]);

    useEffect(() => {
        fetchHackathon();
    }, [id]);

    const fetchHackathon = async () => {
        try {
            const { data } = await api.get(`/hackathons/${id}`);
            setHackathon(data);
            if (data.allowIndividual) setRegType('individual');
            else if (data.allowTeam) setRegType('team');
        } catch (error) {
            console.error("Failed to fetch hackathon", error);
            toast.error("Hackathon not found");
            router.push('/hackathons');
        } finally {
            setLoading(false);
        }
    };

    const handleAddMember = () => {
        if (!memberEmail || !memberName || !memberMobile) {
            toast.error("Please fill all required member details");
            return;
        }
        if (memberEmail === user?.email) {
            toast.error("You are already the leader of this squad. Recruit someone else!");
            return;
        }
        if (members.some(m => m.email === memberEmail)) {
            toast.error("This warrior is already in your recruitment list");
            return;
        }
        if (members.length + 1 >= (hackathon?.maxTeamSize || 1)) {
            toast.error(`Your squad has reached the maximum size of ${hackathon?.maxTeamSize}`);
            return;
        }
        setMembers([...members, {
            name: memberName,
            email: memberEmail,
            mobile: memberMobile,
            collegeEmail: memberIsStudying ? memberCollegeEmail : undefined,
            highestQualification: !memberIsStudying ? memberHighestQualification : undefined
        }]);
        // Reset fields
        setMemberName("");
        setMemberEmail("");
        setMemberMobile("");
        setMemberIsStudying(true);
        setMemberCollegeEmail("");
        setMemberHighestQualification("");
    };

    const handleRegister = async () => {
        if (!name || !mobile) {
            toast.error("Please provide your name and mobile number for the arena records");
            return;
        }

        if (regType === 'team' && !teamName) {
            toast.error("Please enter a team name");
            return;
        }

        setRegistering(true);
        try {
            await api.post(`/hackathons/${id}/register`, {
                registrationType: regType,
                teamName: regType === 'team' ? teamName : undefined,
                members: regType === 'team' ? members.map(m => ({
                    ...m,
                    collegeEmail: m.collegeEmail || undefined,
                    highestQualification: m.highestQualification || undefined
                })) : undefined,
                name,
                mobile,
                collegeEmail: (isStudying && collegeEmail) ? collegeEmail : undefined,
                highestQualification: (!isStudying && highestQualification) ? highestQualification : undefined
            });
            toast.success("Registration successful! Prepare for battle.");
            setShowRegisterModal(false);
            router.refresh();
            fetchHackathon();
        } catch (error: any) {
            const message = error.response?.data?.message;
            if (Array.isArray(message)) {
                toast.error(message[0]);
            } else {
                toast.error(message || "Registration failed");
            }
        } finally {
            setRegistering(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-violet-500" /></div>;
    if (!hackathon) return null;

    const isRegOpen = hackathon.status === 'registration_open';

    return (
        <div className="min-h-screen bg-black text-white pb-24">
            <NavBar />

            {/* Hero Section */}
            <div className="relative h-[500px] w-full">
                {hackathon.bannerUrl ? (
                    <img src={hackathon.bannerUrl} alt={hackathon.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-violet-900/40 via-fuchsia-900/20 to-black flex items-center justify-center">
                        <Trophy className="w-32 h-32 text-white/10" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 w-full p-12">
                    <div className="container mx-auto">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                            <div>
                                <h1 className="text-6xl md:text-8xl font-black mb-4 tracking-tighter uppercase italic bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500">{hackathon.title}</h1>
                                <div className="flex flex-wrap gap-6 text-zinc-300 font-bold uppercase tracking-widest text-xs">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10">
                                        <Calendar className="w-4 h-4 text-violet-400" />
                                        {new Date(hackathon.startDate).toLocaleDateString()} - {new Date(hackathon.endDate).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10">
                                        <Users className="w-4 h-4 text-fuchsia-400" />
                                        1-{hackathon.maxTeamSize} Members
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10">
                                        <Clock className="w-4 h-4 text-emerald-400" />
                                        Ends: {new Date(hackathon.registrationEnd).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                            <div className="flex-shrink-0 flex gap-4">
                                {hackathon.userRegistration ? (
                                    <div className="flex flex-col gap-4">
                                        <div className="flex gap-4">
                                            {hackathon.userRegistration.teamStatus === 'approved' ? (
                                                <div className="px-8 py-5 bg-green-600/10 border border-green-500/20 text-green-400 font-extrabold text-lg rounded-2xl flex items-center gap-3 uppercase italic">
                                                    <Check className="w-6 h-6" /> Approved
                                                </div>
                                            ) : hackathon.userRegistration.teamStatus === 'rejected' ? (
                                                <div className="px-8 py-5 bg-red-600/10 border border-red-500/20 text-red-400 font-extrabold text-lg rounded-2xl flex items-center gap-3 uppercase italic">
                                                    <X className="w-6 h-6" /> Rejected
                                                </div>
                                            ) : (
                                                <div className="px-8 py-5 bg-white/5 border border-white/10 text-zinc-400 font-extrabold text-lg rounded-2xl flex items-center gap-3 uppercase italic">
                                                    <Clock className="w-6 h-6" /> Enlisted
                                                </div>
                                            )}
                                            {hackathon.userRegistration.teamId && (
                                                <Link
                                                    href={`/hackathons/${id}/team`}
                                                    className="px-8 py-5 bg-violet-600 hover:bg-violet-500 text-white font-black text-lg rounded-2xl border-b-4 border-violet-800 transition-all uppercase tracking-widest"
                                                >
                                                    Manage Squad
                                                </Link>
                                            )}
                                        </div>
                                        {hackathon.userRegistration.teamStatus === 'rejected' && hackathon.userRegistration.rejectReason && (
                                            <p className="text-red-400 text-xs font-bold uppercase tracking-widest bg-red-500/5 p-3 rounded-xl border border-red-500/10">
                                                Reason: {hackathon.userRegistration.rejectReason}
                                            </p>
                                        )}
                                    </div>
                                ) : isRegOpen ? (
                                    <>
                                        {hackathon.allowIndividual && (
                                            <button
                                                onClick={() => { setRegType('individual'); setShowRegisterModal(true); }}
                                                className="px-8 py-5 bg-violet-600 hover:bg-violet-500 text-white font-black text-lg rounded-2xl border-b-4 border-violet-800 hover:border-violet-700 transition-all hover:scale-105 active:translate-y-1 active:border-b-0 uppercase tracking-widest"
                                            >
                                                Register Solo
                                            </button>
                                        )}
                                        {hackathon.allowTeam && (
                                            <button
                                                onClick={() => { setRegType('team'); setShowRegisterModal(true); }}
                                                className="px-8 py-5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black text-lg rounded-2xl border-b-4 border-fuchsia-800 hover:border-fuchsia-700 transition-all hover:scale-105 active:translate-y-1 active:border-b-0 uppercase tracking-widest"
                                            >
                                                Register Team
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <div className="px-8 py-5 bg-zinc-800/50 border border-zinc-700 text-zinc-500 font-black text-lg rounded-2xl uppercase italic tracking-widest">
                                        {hackathon.status === 'registration_closed' ? 'Closed' :
                                            hackathon.status === 'teams_forming' ? 'Finalizing' :
                                                hackathon.status === 'approval_in_progress' ? 'Reviewing' :
                                                    'Locked'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 mt-20">
                <div className="grid lg:grid-cols-3 gap-16">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-24">
                        {/* Description */}
                        <section>
                            <h2 className="text-4xl font-black mb-10 italic uppercase tracking-tighter flex items-center gap-4">
                                <span className="w-3 h-10 bg-violet-600 rounded-full" />
                                Mission Briefing
                            </h2>
                            <div className="prose prose-invert prose-violet max-w-none text-zinc-300">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{hackathon.description}</ReactMarkdown>
                            </div>
                        </section>

                        {/* Rounds */}
                        <section>
                            <h2 className="text-4xl font-black mb-12 italic uppercase tracking-tighter flex items-center gap-4">
                                <span className="w-3 h-10 bg-fuchsia-600 rounded-full" />
                                Battle Phases
                            </h2>
                            <div className="space-y-6">
                                {hackathon.rounds.sort((a, b) => a.roundNumber - b.roundNumber).map((round, idx) => (
                                    <div key={idx} className="group relative p-10 bg-zinc-900/50 border border-zinc-800 rounded-[3rem] hover:border-violet-500/30 transition-all overflow-hidden">
                                        <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <span className="text-[12rem] font-black italic leading-none">{round.roundNumber}</span>
                                        </div>
                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-8">
                                                <div>
                                                    <span className="text-[10px] font-black text-violet-500 uppercase tracking-[0.3em] mb-2 block">PHASE {round.roundNumber}</span>
                                                    <h3 className="text-4xl font-black italic uppercase tracking-tight">{round.title}</h3>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-black italic text-zinc-300">{new Date(round.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                                                    <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest mt-1">to {new Date(round.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                                                </div>
                                            </div>
                                            <div className="text-zinc-400 mb-10 max-w-2xl text-lg leading-relaxed">
                                                {round.description}
                                            </div>
                                            <div className="flex flex-wrap gap-4 items-center">
                                                {round.allowZip && <span className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 rounded-xl text-xs font-bold text-zinc-400 border border-white/5"><FileArchive className="w-4 h-4" /> Source Code</span>}
                                                {round.allowGithub && <span className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 rounded-xl text-xs font-bold text-zinc-400 border border-white/5"><Github className="w-4 h-4" /> GitHub Repo</span>}
                                                {round.allowVideo && <span className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 rounded-xl text-xs font-bold text-zinc-400 border border-white/5"><Video className="w-4 h-4" /> Pitch Video</span>}
                                                {round.allowDescription && <span className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 rounded-xl text-xs font-bold text-zinc-400 border border-white/5"><MessageCircle className="w-4 h-4" /> Documentation</span>}

                                                <div className="ml-auto flex items-center gap-4 px-6 py-2 bg-violet-600/10 rounded-2xl border border-violet-600/20">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-violet-500">Weight</span>
                                                    <span className="text-2xl font-black italic text-violet-400">{round.weightagePercentage}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Evaluation */}
                        {hackathon.evaluationCriteria && (
                            <section>
                                <h2 className="text-4xl font-black mb-10 italic uppercase tracking-tighter flex items-center gap-4">
                                    <span className="w-3 h-10 bg-emerald-600 rounded-full" />
                                    Judgment Protocol
                                </h2>
                                <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[3rem] prose prose-invert prose-emerald max-w-none text-zinc-300">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{hackathon.evaluationCriteria}</ReactMarkdown>
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-12">
                        {/* Rules */}
                        {hackathon.rules && (
                            <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[3rem]">
                                <h3 className="text-2xl font-black italic uppercase mb-8 flex items-center gap-3">
                                    <ShieldAlert className="w-6 h-6 text-red-500" />
                                    Battle Laws
                                </h3>
                                <div className="prose prose-invert prose-sm prose-red max-w-none text-zinc-400">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{hackathon.rules}</ReactMarkdown>
                                </div>
                            </div>
                        )}

                        {/* CTA Mobile Floating or Sidebar */}
                        <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[3rem] space-y-6 sticky top-24">
                            <h3 className="text-xl font-bold uppercase italic text-zinc-500">Quick Stats</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-3 border-b border-white/5 text-sm">
                                    <span className="font-bold text-zinc-500">REGISTRATION</span>
                                    <span className={isRegOpen ? "text-green-500 font-black italic" : "text-red-500 font-black italic"}>
                                        {isRegOpen ? "OPEN NOW" : "CLOSED"}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-white/5 text-sm">
                                    <span className="font-bold text-zinc-500">TEAM SIZE</span>
                                    <span className="text-white font-black italic">1 TO {hackathon.maxTeamSize}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 text-sm">
                                    <span className="font-bold text-zinc-500">START DATE</span>
                                    <span className="text-white font-black italic">{new Date(hackathon.startDate).toLocaleDateString()}</span>
                                </div>
                            </div>
                            {isRegOpen ? (
                                <div className="space-y-4">
                                    {hackathon.allowIndividual && (
                                        <button
                                            onClick={() => { setRegType('individual'); setShowRegisterModal(true); }}
                                            className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white font-black italic uppercase rounded-2xl transition-all shadow-xl shadow-violet-600/20"
                                        >
                                            Enlist Solo
                                        </button>
                                    )}
                                    {hackathon.allowTeam && (
                                        <button
                                            onClick={() => { setRegType('team'); setShowRegisterModal(true); }}
                                            className="w-full py-4 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-black italic uppercase rounded-2xl transition-all shadow-xl shadow-fuchsia-600/20"
                                        >
                                            Enlist Team
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <button disabled className="w-full py-4 bg-zinc-800 text-zinc-600 font-black italic uppercase rounded-2xl">
                                    Registration Closed
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Registration Modal */}
            {showRegisterModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowRegisterModal(false)} />
                    <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-[3.5rem] p-12 overflow-hidden shadow-2xl animate-in zoom-in-95 fade-in duration-300">
                        <div className="absolute top-0 right-0 p-8">
                            <button onClick={() => setShowRegisterModal(false)} className="p-2 text-zinc-500 hover:text-white transition-colors">
                                <X className="w-8 h-8" />
                            </button>
                        </div>

                        <div className="mb-10">
                            <span className="text-[10px] font-black text-violet-500 uppercase tracking-[0.5em] mb-3 block">ENLISTMENT</span>
                            <h2 className="text-4xl font-black italic uppercase tracking-tighter">Enter the Arena</h2>
                        </div>

                        <div className="space-y-10">
                            {/* Type Selection */}
                            <div className="flex p-2 bg-black rounded-3xl border border-zinc-800">
                                {hackathon.allowIndividual && (
                                    <button
                                        onClick={() => setRegType('individual')}
                                        className={`flex-1 py-4 text-center rounded-2xl font-black italic uppercase transition-all ${regType === 'individual' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/40' : 'text-zinc-600 hover:text-zinc-400'}`}
                                    >
                                        Solo Warrior
                                    </button>
                                )}
                                {hackathon.allowTeam && (
                                    <button
                                        onClick={() => setRegType('team')}
                                        className={`flex-1 py-4 text-center rounded-2xl font-black italic uppercase transition-all ${regType === 'team' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/40' : 'text-zinc-600 hover:text-zinc-400'}`}
                                    >
                                        Team Enlistment
                                    </button>
                                )}
                            </div>

                            {/* Contact Details */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-3 ml-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Enter your name"
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:border-violet-600 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-3 ml-1">Mobile Number</label>
                                    <input
                                        type="text"
                                        value={mobile}
                                        onChange={(e) => setMobile(e.target.value)}
                                        placeholder="+91 00000 00000"
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:border-violet-600 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setIsStudying(true)}
                                        className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest border transition-all ${isStudying ? 'bg-white/10 border-white/20 text-white' : 'border-transparent text-zinc-600'}`}
                                    >
                                        I am a Student
                                    </button>
                                    <button
                                        onClick={() => setIsStudying(false)}
                                        className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest border transition-all ${!isStudying ? 'bg-white/10 border-white/20 text-white' : 'border-transparent text-zinc-600'}`}
                                    >
                                        I am a Professional
                                    </button>
                                </div>

                                {isStudying ? (
                                    <div className="animate-in slide-in-from-top-2 duration-300">
                                        <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-3 ml-1">College Email</label>
                                        <input
                                            type="email"
                                            value={collegeEmail}
                                            onChange={(e) => setCollegeEmail(e.target.value)}
                                            placeholder="yourname@college.edu"
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:border-violet-600 outline-none transition-all"
                                        />
                                    </div>
                                ) : (
                                    <div className="animate-in slide-in-from-top-2 duration-300">
                                        <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-3 ml-1">Highest Qualification</label>
                                        <input
                                            type="text"
                                            value={highestQualification}
                                            onChange={(e) => setHighestQualification(e.target.value)}
                                            placeholder="e.g. B.Tech in CS, MBA, etc."
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:border-violet-600 outline-none transition-all"
                                        />
                                    </div>
                                )}
                            </div>

                            {regType === 'individual' ? (
                                <div className="text-center py-10 px-8 bg-zinc-950 rounded-[2.5rem] border border-zinc-800/50">
                                    <Check className="w-16 h-16 text-green-500 mx-auto mb-6 opacity-20" />
                                    <p className="text-zinc-400 text-lg leading-relaxed">
                                        You are registering as an <strong className="text-white">Individual Participant</strong>.
                                        Your progress and submissions will be under your own profile.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-8 animate-in slide-in-from-bottom-4">
                                    <div className="space-y-8">
                                        <div>
                                            <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-3 ml-1">Team Identity</label>
                                            <input
                                                type="text"
                                                value={teamName}
                                                onChange={(e) => setTeamName(e.target.value)}
                                                placeholder="Enter Team Name"
                                                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-8 py-5 text-xl font-bold text-white focus:border-violet-600 outline-none transition-all shadow-2xl"
                                            />
                                        </div>

                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Squad Members</label>
                                            <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Limit: {hackathon.maxTeamSize} Total</span>
                                        </div>

                                        {/* Member List */}
                                        <div className="space-y-4">
                                            {members.map((m, idx) => (
                                                <div key={idx} className="p-6 bg-zinc-950 border border-zinc-800 rounded-[2rem] flex items-center justify-between group animate-in slide-in-from-left-2 transition-all hover:border-violet-600/30">
                                                    <div className="flex items-center gap-6">
                                                        <div className="w-12 h-12 bg-violet-600/10 rounded-2xl flex items-center justify-center border border-violet-600/20">
                                                            <Users className="w-6 h-6 text-violet-500" />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-white font-black italic uppercase tracking-tight">{m.name}</h4>
                                                            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">
                                                                {m.email} • {m.mobile}
                                                                <br />
                                                                <span className="text-zinc-600">{m.collegeEmail || m.highestQualification}</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => setMembers(members.filter((_, i) => i !== idx))} className="p-2 text-zinc-600 hover:text-red-500 transition-all">
                                                        <X className="w-6 h-6" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Add Member Form */}
                                        {members.length + 1 < (hackathon?.maxTeamSize || 1) ? (
                                            <div className="p-10 bg-black/40 border border-dashed border-zinc-800 rounded-[3rem] space-y-8 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                                    <UserPlus className="w-24 h-24" />
                                                </div>

                                                <div className="grid md:grid-cols-2 gap-6 relative z-10">
                                                    <div>
                                                        <label className="block text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-2 ml-1">Member Name</label>
                                                        <input
                                                            type="text"
                                                            value={memberName}
                                                            onChange={(e) => setMemberName(e.target.value)}
                                                            placeholder="Warrior Name"
                                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-xs font-bold text-white focus:border-violet-600 outline-none transition-all"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-2 ml-1">Member Email</label>
                                                        <input
                                                            type="email"
                                                            value={memberEmail}
                                                            onChange={(e) => setMemberEmail(e.target.value)}
                                                            placeholder="Comms Email"
                                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-xs font-bold text-white focus:border-violet-600 outline-none transition-all"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid md:grid-cols-2 gap-6 relative z-10">
                                                    <div>
                                                        <label className="block text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-2 ml-1">Member Mobile</label>
                                                        <input
                                                            type="text"
                                                            value={memberMobile}
                                                            onChange={(e) => setMemberMobile(e.target.value)}
                                                            placeholder="+91 Mobile"
                                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-xs font-bold text-white focus:border-violet-600 outline-none transition-all"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-2 ml-1">Member Rank</label>
                                                        <div className="flex bg-zinc-950 border border-zinc-800 rounded-2xl p-1.5 h-[58px]">
                                                            <button
                                                                onClick={() => setMemberIsStudying(true)}
                                                                className={`flex-1 rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all ${memberIsStudying ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-600'}`}
                                                            >
                                                                Student
                                                            </button>
                                                            <button
                                                                onClick={() => setMemberIsStudying(false)}
                                                                className={`flex-1 rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all ${!memberIsStudying ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-600'}`}
                                                            >
                                                                Elite
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-4 relative z-10">
                                                    <div className="flex-1">
                                                        <label className="block text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-2 ml-1">{memberIsStudying ? "Educational Institution" : "Professional Title"}</label>
                                                        <input
                                                            type="text"
                                                            value={memberIsStudying ? memberCollegeEmail : memberHighestQualification}
                                                            onChange={(e) => memberIsStudying ? setMemberCollegeEmail(e.target.value) : setMemberHighestQualification(e.target.value)}
                                                            placeholder={memberIsStudying ? "College Email" : "Qualification"}
                                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-xs font-bold text-white focus:border-violet-600 outline-none transition-all"
                                                        />
                                                    </div>
                                                    <div className="flex flex-col justify-end">
                                                        <button
                                                            onClick={handleAddMember}
                                                            className="px-10 h-[58px] bg-violet-600 hover:bg-violet-700 text-white font-black italic uppercase text-[10px] tracking-widest rounded-2xl transition-all shadow-xl shadow-violet-600/20 active:scale-95 flex items-center gap-3"
                                                        >
                                                            <UserPlus className="w-4 h-4" /> Recruit
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-10 border border-dashed border-zinc-800 rounded-[3rem] bg-zinc-950/20">
                                                <X className="w-10 h-10 text-zinc-900 mx-auto mb-4" />
                                                <p className="text-zinc-600 font-black uppercase tracking-widest text-[10px]">Squad Capacity Reached</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="pt-6">
                                <button
                                    onClick={handleRegister}
                                    disabled={registering}
                                    className="w-full py-6 bg-white text-black font-black italic uppercase text-2xl rounded-3xl shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-4"
                                >
                                    {registering ? <Loader2 className="w-8 h-8 animate-spin" /> : "Confirm Enlistment"}
                                </button>
                                <p className="text-center text-zinc-600 text-[10px] font-black uppercase tracking-widest mt-6">By enlisting, you agree to the battle laws and mission protocol.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
