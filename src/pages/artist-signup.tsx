import { useState,useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import TrialBanner from '@/components/TrialBanner';
import { isTrialActive } from '@/util/isTrialActive';
import { isActivePro } from '@/util/isActivePro';

const topGenres = [
  'Jazz', 'Rock', 'Pop', 'Hip-Hop', 'R&B', 'Electronic',
  'Country', 'Reggae', 'Soul', 'Funk', 'Blues', 'Indie'
];

export default function ArtistSignupPage() {
  const { user, refetchUser } = useAuth();
  const router = useRouter();

  const trialActive = isTrialActive(user?.trial_ends_at);
  const proActive = isActivePro(user as any);
  const trialExpired = user && !proActive && !!user.trial_ends_at && !trialActive;

  const [form, setForm] = useState({
    display_name: '',
    bio: '',
    contact_email: user?.email || '',
    genres: [] as string[],
    slug: '',
    embed_youtube: '',
    embed_soundcloud: '',
    embed_bandcamp: '',
    website: '',
    tip_jar_url: '',
  });

  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    profile_image: null,
    promo_photo: null,
    stage_plot: null,
    press_kit: null,
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
const [wantsTrial, setWantsTrial] = useState(false);
const [wantsSubscribe, setWantsSubscribe] = useState(false);
const [plan, setPlan] = useState<'monthly'|'annual'>('monthly');


useEffect(() => {
  if (wantsTrial) setWantsSubscribe(false);
}, [wantsTrial]);
useEffect(() => {
  if (wantsSubscribe) setWantsTrial(false);
}, [wantsSubscribe]);

const canStartTrial = !proActive && !trialActive;


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
  
    let cleanValue = value;
  
    // Auto-extract iframe src if user pastes embed code
    const iframeMatch = value.match(/<iframe.*?src=["'](.*?)["']/);
    if (iframeMatch) {
      cleanValue = iframeMatch[1]; // The extracted src URL
    }
  
    setForm(prev => ({ ...prev, [name]: cleanValue }));
  };
  

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files: selected } = e.target;
    if (selected && selected.length > 0) {
      setFiles(prev => ({ ...prev, [name]: selected[0] }));
    }
  };

  const handleGenreToggle = (genre: string) => {
    setForm(prev => {
      const alreadySelected = prev.genres.includes(genre);
      const newGenres = alreadySelected
        ? prev.genres.filter(g => g !== genre)
        : prev.genres.length < 4
          ? [...prev.genres, genre]
          : prev.genres;

      if (!alreadySelected && prev.genres.length >= 4) {
        setError('You can only select up to 4 genres.');
      } else {
        setError('');
      }

      return { ...prev, genres: newGenres };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!user || form.genres.length === 0 || !files.profile_image) {
    setError("Missing required fields");
    return;
  }

  setLoading(true);
  try {
    // 1) create draft
    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => formData.append(k, Array.isArray(v) ? JSON.stringify(v) : String(v || '')));
    Object.entries(files).forEach(([k, f]) => { if (f) formData.append(k, f); });

    const createRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artists`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });
    if (!createRes.ok) throw new Error('Failed to create artist profile');
    const created = await createRes.json(); // { id, slug, ... }

    // 2) branch
    if (wantsTrial && canStartTrial) {
      // start trial → publish → go to page
      const tRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artists/trial/start`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!tRes.ok) throw new Error('Could not start trial');

      // publish (requires access)
      const pubRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artists/${created.id}/publish`, {
        method: 'PUT',
        credentials: 'include'
      });
      if (!pubRes.ok) throw new Error('Could not publish after trial');

      await refetchUser();
      router.push(`/artists/${created.slug}?pending=true&trial=active`);
      return;
    }

    if (wantsSubscribe && !proActive) {
      // kick off Stripe checkout; server should embed {intent: 'publish_artist', artist_id}
      const coRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/create-checkout-session`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, plan, artistId: created.id, intent: 'publish_artist' })
      });
      const co = await coRes.json();
      if (!coRes.ok || !co.url) throw new Error(co.message || 'Checkout failed');
      window.location.href = co.url;
      return;
    }

    // neither selected → stay as draft; owner can see; admin will approve later
    router.push(`/artists/${created.slug}?pending=true`);
  } catch (err: any) {
    setError(err.message || 'Something went wrong');
  } finally {
    setLoading(false);
  }
};


  if (trialExpired) {
    return (
      <div className="max-w-xl mx-auto p-6 text-white text-center">
        <TrialBanner trial_ends_at={user!.trial_ends_at} />
        <p className="mb-4">Your free trial has expired. Upgrade to Alpine Pro to manage an artist profile.</p>
        <Link href="/upgrade" className="text-blue-400 underline">Upgrade Now</Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6 text-white">
      <TrialBanner trial_ends_at={user?.trial_ends_at} />
      <h1 className="text-2xl font-bold mb-2">🎤 Claim Your Artist Profile</h1>
      <p className="text-sm text-gray-300 mb-4">
        Create your public artist profile and enjoy 30 days of Alpine Pro access free.
        Add your music, bio, media kit, and upcoming shows — no credit card required!
      </p>      
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="display_name" placeholder="Display Name" value={form.display_name} onChange={handleChange} className="w-full p-2 rounded bg-gray-800 border border-gray-600" />

        <input
          name="slug"
          placeholder="URL Slug (e.g. reid-poole-quartet)"
          value={form.slug}
          onChange={handleChange}
          className="w-full p-2 rounded bg-gray-800 border border-gray-600"
        />
        <p className="text-sm text-gray-400">
          This becomes your public link: <code>/artists/{form.slug || 'your-slug'}</code>
        </p>

        <label className="block text-sm font-semibold">Profile Image</label>
        <input type="file" name="profile_image" accept="image/*" onChange={handleFileChange} className="w-full text-sm" />

        <input name="contact_email" placeholder="Contact Email" value={form.contact_email} onChange={handleChange} className="w-full p-2 rounded bg-gray-800 border border-gray-600" />
        <textarea name="bio" placeholder="Bio" value={form.bio} onChange={handleChange} className="w-full p-2 rounded bg-gray-800 border border-gray-600" rows={4} />

        <div>
          <label className="block font-semibold mb-1">Pick up to 4 Genres</label>
          <div className="grid grid-cols-2 gap-2">
            {topGenres.map((genre) => (
              <label key={genre} className="flex items-center">
                <input type="checkbox" value={genre} checked={form.genres.includes(genre)} onChange={() => handleGenreToggle(genre)} className="mr-2" />
                {genre}
              </label>
            ))}
          </div>
        </div>

        <input name="website" placeholder="Website (https://...)" value={form.website} onChange={handleChange} className="w-full p-2 rounded bg-gray-800 border border-gray-600" />
        <input
          name="tip_jar_url"
          placeholder="Tip Jar (Venmo/PayPal URL)"
          value={form.tip_jar_url}
          onChange={handleChange}
          className="w-full p-2 rounded bg-gray-800 border border-gray-600"
        />

        <input name="embed_youtube" placeholder="Paste YouTube embed link or iframe code" value={form.embed_youtube} onChange={handleChange} className="w-full p-2 rounded bg-gray-800 border border-gray-600" />
        {form.embed_youtube && (
          <div className="mt-2">
            <p className="text-xs text-gray-400 mb-1">Preview:</p>
            <iframe
              src={form.embed_youtube}
              title="YouTube Preview"
              width="100%"
              height="250"
              className="rounded border border-gray-600"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        <input name="embed_soundcloud" placeholder="Paste SoundCloud embed link or iframe code" value={form.embed_soundcloud} onChange={handleChange} className="w-full p-2 rounded bg-gray-800 border border-gray-600" />
        {form.embed_soundcloud && (
          <div className="mt-2">
            <p className="text-xs text-gray-400 mb-1">Preview:</p>
            <iframe
              width="100%"
              height="166"
              scrolling="no"
              frameBorder="no"
              allow="autoplay"
              src={form.embed_soundcloud}
              className="rounded border border-gray-600"
            />
          </div>
        )}

        <input name="embed_bandcamp" placeholder="Paste Bandcamp embed link or iframe code" value={form.embed_bandcamp} onChange={handleChange} className="w-full p-2 rounded bg-gray-800 border border-gray-600" />
        {form.embed_bandcamp && (
          <div className="mt-2">
            <p className="text-xs text-gray-400 mb-1">Preview:</p>
            <iframe
              style={{ border: '0', width: '100%', height: '120px' }}
              src={form.embed_bandcamp}
              seamless
              className="rounded border border-gray-600"
            />
          </div>
        )}

        <label className="block text-sm font-semibold mt-4">Promo Photo</label>
        <input type="file" name="promo_photo" accept="image/*" onChange={handleFileChange} className="w-full text-sm" />

        <label className="block text-sm font-semibold mt-4">Stage Plot</label>
        <input type="file" name="stage_plot" accept="image/*,.pdf" onChange={handleFileChange} className="w-full text-sm" />

        <label className="block text-sm font-semibold mt-4">Press Kit</label>
        <input type="file" name="press_kit" accept="application/pdf,image/*" onChange={handleFileChange} className="w-full text-sm" />

        {/* Access choices */}
        <div className="mt-6 border-t border-gray-700 pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={wantsTrial}
                onChange={e => setWantsTrial(e.target.checked)}
                disabled={!canStartTrial} // already Pro or in a trial? can’t start again
              />
              <span>Start 30-day Trial & publish</span>
            </label>
            {!canStartTrial && <span className="text-xs text-gray-400">Already Pro or trial active</span>}
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={wantsSubscribe}
                onChange={e => setWantsSubscribe(e.target.checked)}
                disabled={proActive} // already Pro? no need
              />
              <span>Subscribe to Pro & publish</span>
            </label>
            <div className="flex items-center gap-3 text-sm">
              <label className="flex items-center gap-1 opacity-90">
                <input type="radio" name="plan" checked={plan==='monthly'} onChange={()=>setPlan('monthly')} disabled={!wantsSubscribe || proActive}/>
                Monthly
              </label>
              <label className="flex items-center gap-1 opacity-90">
                <input type="radio" name="plan" checked={plan==='annual'} onChange={()=>setPlan('annual')} disabled={!wantsSubscribe || proActive}/>
                Annual
              </label>
            </div>
          </div>

          <p className="text-xs text-gray-400">
            If neither is selected, we’ll create a draft and submit for approval. The public page will appear after approval; Pro-only features will be blurred until trial/subscription is active.
          </p>
        </div>

        {error && <p className="text-red-500">{error}</p>}
        <button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white">
          {loading ? 'Creating…' : 'Create Profile'}
        </button>
      </form>
    </div>
  );
}
