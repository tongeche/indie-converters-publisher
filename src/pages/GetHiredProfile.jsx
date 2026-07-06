import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { fetchFreelancerProfile, upsertFreelancerProfile } from '../lib/api';
import './GetHiredProfile.css';

const IconEdit   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>;
const IconBook   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
const IconImage  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
const IconLayout = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>;

const SERVICE_TYPES = [
  { slug: 'ghostwriting',  label: 'Ghostwriting',  Icon: IconBook },
  { slug: 'editing',       label: 'Editing',       Icon: IconEdit },
  { slug: 'cover-design',  label: 'Cover Design',  Icon: IconImage },
  { slug: 'formatting',    label: 'Formatting',    Icon: IconLayout },
  { slug: 'other',         label: 'Other',         Icon: IconEdit },
];

const EMPTY_ERRORS = {};

export default function GetHiredProfile() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    displayName:   '',
    serviceTypes:  [],
    bio:           '',
    portfolioUrl:  '',
    rateMin:       '',
    rateMax:       '',
    location:      '',
    contactEmail:  user?.email || '',
    photoUrl:      '',
    coverImageUrl: '',
    skills:        [],
    newSkill:      '',
    languages:     [],
    newLanguage:   '',
  });
  const [loading,      setLoading]      = useState(true);
  const [errors,       setErrors]       = useState(EMPTY_ERRORS);
  const [saving,       setSaving]       = useState(false);
  const [saveError,    setSaveError]    = useState('');
  const [saved,        setSaved]        = useState(false);
  const [photoFile,    setPhotoFile]    = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [coverFile,    setCoverFile]    = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const photoRef = useRef(null);
  const coverRef = useRef(null);

  useEffect(() => {
    fetchFreelancerProfile(user.id).then(profile => {
      if (profile) {
        setForm({
          displayName:   profile.display_name   || '',
          serviceTypes:  profile.service_types   || [],
          bio:           profile.bio             || '',
          portfolioUrl:  profile.portfolio_url   || '',
          rateMin:       profile.rate_min != null ? String(profile.rate_min) : '',
          rateMax:       profile.rate_max != null ? String(profile.rate_max) : '',
          location:      profile.location        || '',
          contactEmail:  profile.contact_email   || user.email || '',
          photoUrl:      profile.photo_url       || '',
          coverImageUrl: profile.cover_image_url || '',
          skills:        profile.skills          || [],
          newSkill:      '',
          languages:     profile.languages       || [],
          newLanguage:   '',
        });
        setPhotoPreview(profile.photo_url || '');
        setCoverPreview(profile.cover_image_url || '');
      }
      setLoading(false);
    });
  }, [user.id, user.email]);

  function handlePhoto(file) {
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function handleCover(file) {
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  const initials = form.displayName.trim()
    ? form.displayName.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  function setField(key, value) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function addTag(listKey, inputKey, max) {
    const val = form[inputKey].trim();
    if (!val || form[listKey].includes(val) || form[listKey].length >= max) return;
    setForm(f => ({ ...f, [listKey]: [...f[listKey], val], [inputKey]: '' }));
  }

  function removeTag(listKey, value) {
    setForm(f => ({ ...f, [listKey]: f[listKey].filter(x => x !== value) }));
  }

  function toggleServiceType(slug) {
    setForm(f => ({
      ...f,
      serviceTypes: f.serviceTypes.includes(slug)
        ? f.serviceTypes.filter(x => x !== slug)
        : [...f.serviceTypes, slug],
    }));
  }

  function validate() {
    const next = {};
    if (!form.displayName.trim())     next.displayName  = 'Your name is required';
    if (form.serviceTypes.length === 0) next.serviceTypes = 'Pick at least one service';
    if (!form.bio.trim())             next.bio          = 'Tell authors what you do';
    if (!/^\S+@\S+\.\S+$/.test(form.contactEmail)) next.contactEmail = 'Enter a valid email';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaveError('');
    setSaved(false);
    if (!validate()) return;

    setSaving(true);
    try {
      let photoUrl = form.photoUrl;
      if (photoFile) {
        const path = `${user.id}/freelancer-avatar-${Date.now()}-${photoFile.name}`;
        const { error: ue } = await supabase.storage.from('covers').upload(path, photoFile);
        if (!ue) {
          photoUrl = supabase.storage.from('covers').getPublicUrl(path).data.publicUrl;
          setField('photoUrl', photoUrl);
        }
      }

      let coverImageUrl = form.coverImageUrl;
      if (coverFile) {
        const path = `${user.id}/freelancer-cover-${Date.now()}-${coverFile.name}`;
        const { error: ce } = await supabase.storage.from('covers').upload(path, coverFile);
        if (!ce) {
          coverImageUrl = supabase.storage.from('covers').getPublicUrl(path).data.publicUrl;
          setField('coverImageUrl', coverImageUrl);
        }
      }

      await upsertFreelancerProfile(user.id, {
        display_name:    form.displayName.trim(),
        service_types:   form.serviceTypes,
        bio:             form.bio.trim(),
        portfolio_url:   form.portfolioUrl.trim() || null,
        rate_min:        form.rateMin ? Number(form.rateMin) : null,
        rate_max:        form.rateMax ? Number(form.rateMax) : null,
        location:        form.location.trim() || null,
        contact_email:   form.contactEmail.trim(),
        photo_url:       photoUrl || null,
        cover_image_url: coverImageUrl || null,
        skills:          form.skills,
        languages:       form.languages,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setSaveError(err.message || 'Something went wrong — please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  return (
    <div className="ghp-page">
      <div className="container ghp-header">
        <span className="ghp-eyebrow">·· Get Hired</span>
        <h1 className="ghp-h1">Your freelancer profile</h1>
        <p className="ghp-sub">This is what authors will see when browsing freelancers. Keep it sharp and specific.</p>
      </div>

      <div className="container ghp-body">
        <form className="ghp-form" onSubmit={handleSubmit} noValidate>

          <div className="ghp-cover-field">
            <label>Cover image <span className="ghp-opt">optional</span></label>
            <div
              className="ghp-cover-preview"
              style={coverPreview ? { backgroundImage: `url(${coverPreview})` } : undefined}
            >
              {!coverPreview && <span>No cover image yet</span>}
            </div>
            <input
              ref={coverRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={e => { if (e.target.files[0]) handleCover(e.target.files[0]); }}
            />
            <button
              type="button"
              className="btn btn-outline ghp-photo-upload-btn"
              onClick={() => coverRef.current?.click()}
            >
              Upload cover image
            </button>
            <span className="ghp-photo-hint">A wide banner shown at the top of your card on the browse page.</span>
          </div>

          <div className="ghp-photo-row">
            <div className="ghp-photo-avatar">
              {photoPreview
                ? <img src={photoPreview} alt="Profile" />
                : <span>{initials}</span>
              }
            </div>
            <div className="ghp-photo-actions">
              <input
                ref={photoRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={e => { if (e.target.files[0]) handlePhoto(e.target.files[0]); }}
              />
              <button
                type="button"
                className="btn btn-outline ghp-photo-upload-btn"
                onClick={() => photoRef.current?.click()}
              >
                Upload photo
              </button>
              <span className="ghp-photo-hint">JPG, PNG or WebP. Shown on your profile card.</span>
            </div>
          </div>

          <div className="ghp-field">
            <label htmlFor="displayName">Name<span className="ghp-req">*</span></label>
            <input
              id="displayName"
              type="text"
              placeholder="Jane Doe"
              value={form.displayName}
              onChange={e => setField('displayName', e.target.value)}
            />
            {errors.displayName && <span className="ghp-error">{errors.displayName}</span>}
          </div>

          <div className="ghp-field">
            <label>Services <span className="ghp-opt">select all that apply</span></label>
            <div className="ghp-service-grid">
              {SERVICE_TYPES.map(({ slug, label, Icon }) => (
                <button
                  key={slug}
                  type="button"
                  className={`ghp-service-chip ${form.serviceTypes.includes(slug) ? 'is-active' : ''}`}
                  onClick={() => toggleServiceType(slug)}
                >
                  <Icon />
                  <span>{label}</span>
                </button>
              ))}
            </div>
            {errors.serviceTypes && <span className="ghp-error">{errors.serviceTypes}</span>}
          </div>

          <div className="ghp-field">
            <label>Skills <span className="ghp-opt">{form.skills.length} / 8</span></label>
            <div className="ghp-tags">
              {form.skills.map(s => (
                <span key={s} className="ghp-tag">
                  {s}
                  <button type="button" onClick={() => removeTag('skills', s)}>×</button>
                </span>
              ))}
              {form.skills.length < 8 && (
                <input
                  className="ghp-tag-input"
                  placeholder="Add a skill…"
                  value={form.newSkill}
                  onChange={e => setField('newSkill', e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      addTag('skills', 'newSkill', 8);
                    }
                  }}
                />
              )}
            </div>
          </div>

          <div className="ghp-field">
            <label>Languages <span className="ghp-opt">{form.languages.length} / 5</span></label>
            <div className="ghp-tags">
              {form.languages.map(l => (
                <span key={l} className="ghp-tag">
                  {l}
                  <button type="button" onClick={() => removeTag('languages', l)}>×</button>
                </span>
              ))}
              {form.languages.length < 5 && (
                <input
                  className="ghp-tag-input"
                  placeholder="Add a language…"
                  value={form.newLanguage}
                  onChange={e => setField('newLanguage', e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      addTag('languages', 'newLanguage', 5);
                    }
                  }}
                />
              )}
            </div>
          </div>

          <div className="ghp-field">
            <label htmlFor="bio">Bio<span className="ghp-req">*</span></label>
            <textarea
              id="bio"
              rows={6}
              placeholder="Your experience, genres you work in, and what makes you a good fit for indie authors."
              value={form.bio}
              onChange={e => setField('bio', e.target.value)}
            />
            {errors.bio && <span className="ghp-error">{errors.bio}</span>}
          </div>

          <div className="ghp-field">
            <label htmlFor="portfolioUrl">Portfolio / website <span className="ghp-opt">optional</span></label>
            <input
              id="portfolioUrl"
              type="url"
              placeholder="https://your-portfolio.com"
              value={form.portfolioUrl}
              onChange={e => setField('portfolioUrl', e.target.value)}
            />
          </div>

          <div className="ghp-row">
            <div className="ghp-field">
              <label htmlFor="rateMin">Rate min <span className="ghp-opt">optional</span></label>
              <input
                id="rateMin"
                type="number"
                min="0"
                placeholder="$"
                value={form.rateMin}
                onChange={e => setField('rateMin', e.target.value)}
              />
            </div>
            <div className="ghp-field">
              <label htmlFor="rateMax">Rate max <span className="ghp-opt">optional</span></label>
              <input
                id="rateMax"
                type="number"
                min="0"
                placeholder="$"
                value={form.rateMax}
                onChange={e => setField('rateMax', e.target.value)}
              />
            </div>
            <div className="ghp-field">
              <label htmlFor="location">Location <span className="ghp-opt">optional</span></label>
              <input
                id="location"
                type="text"
                placeholder="e.g. Remote, Nairobi"
                value={form.location}
                onChange={e => setField('location', e.target.value)}
              />
            </div>
          </div>

          <div className="ghp-field">
            <label htmlFor="contactEmail">Contact email<span className="ghp-req">*</span></label>
            <input
              id="contactEmail"
              type="email"
              placeholder="you@example.com"
              value={form.contactEmail}
              onChange={e => setField('contactEmail', e.target.value)}
            />
            {errors.contactEmail && <span className="ghp-error">{errors.contactEmail}</span>}
          </div>

          {saveError && <div className="ghp-submit-error">{saveError}</div>}
          {saved && <div className="ghp-saved-banner">Profile saved.</div>}

          <div className="ghp-actions">
            <Link to="/get-hired" className="btn btn-outline">Back</Link>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
