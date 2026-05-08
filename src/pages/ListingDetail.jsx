import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { cartBridge } from '../context/CartContext'
import Spinner from '../Components/Spinner'
import '../styles/listing-detail.css'

function SharePanel({ listing }) {
  const { toast } = useToast()
  const url  = `https://masterchefcuts.com/listings/${listing.id}`
  const meta = ANIMAL_META[listing.animalType] || { label: listing.animalType }
  const text = encodeURIComponent(
    `Check out this ${listing.breed || ''} ${meta.label} from ${listing.farmerShopName || listing.farmerName || 'a local farm'} on MasterChef Cuts!`
  )
  const encodedUrl = encodeURIComponent(url)

  function handleNativeShare() {
    if (navigator.share) {
      navigator.share({ title: listing.breed + ' ' + meta.label, text: decodeURIComponent(text), url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url)
        .then(() => toast.success('Link copied to clipboard!'))
        .catch(() => toast.error('Could not copy link.'))
    }
  }

  return (
    <div className="ld-share-panel">
      <button className="ld-share-btn" onClick={handleNativeShare} title="Share or copy link">
        ↗ Share
      </button>
      <a
        className="ld-share-icon ld-share-icon--wa"
        href={`https://wa.me/?text=${text}%20${encodedUrl}`}
        target="_blank" rel="noopener noreferrer"
        title="Share on WhatsApp"
      >🟢</a>
      <a
        className="ld-share-icon ld-share-icon--fb"
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank" rel="noopener noreferrer"
        title="Share on Facebook"
      >📘</a>
      <a
        className="ld-share-icon ld-share-icon--tw"
        href={`https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`}
        target="_blank" rel="noopener noreferrer"
        title="Share on X / Twitter"
      >🐦</a>
      <a
        className="ld-share-icon ld-share-icon--sms"
        href={`sms:?body=${text}%20${encodedUrl}`}
        title="Share via SMS"
      >💬</a>
    </div>
  )
}

const ANIMAL_META = {
  BEEF: { emoji: '🐄', label: 'Beef' },
  PORK: { emoji: '🐷', label: 'Pork' },
  LAMB: { emoji: '🐑', label: 'Lamb' },
}

const STATUS_META = {
  ACTIVE:        { color: '#27ae60', label: 'Active — accepting claims' },
  FULLY_CLAIMED: { color: '#e67e22', label: 'Fully Claimed' },
  PROCESSING:    { color: '#3498db', label: 'Processing' },
  COMPLETE:      { color: '#95a5a6', label: 'Complete' },
}

function StarRating({ value, count }) {
  return (
    <span className="ld-stars">
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= Math.round(value) ? '#f39c12' : 'rgba(255,255,255,0.2)' }}>★</span>
      ))}
      <span className="ld-stars-label">{value.toFixed(1)} ({count})</span>
    </span>
  )
}

export default function ListingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()

  const [listing,   setListing]   = useState(null)
  const [reviews,   setReviews]   = useState([])
  const [claiming,  setClaiming]  = useState(null)
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(true)
  const [alreadyReviewed, setAlreadyReviewed] = useState(false)
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' })
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewDone, setReviewDone] = useState(false)

  const [comments,         setComments]         = useState([])
  const [commentText,      setCommentText]      = useState('')
  const [commentSubmitting,setCommentSubmitting] = useState(false)
  const [deletingComment,  setDeletingComment]  = useState(null)
  const [commentPage,      setCommentPage]      = useState(0)
  const [hasMoreComments,  setHasMoreComments]  = useState(false)
  const [loadingMoreComments, setLoadingMoreComments] = useState(false)

  const [onWaitlist,     setOnWaitlist]     = useState(false)
  const [waitlistLoading,setWaitlistLoading] = useState(false)
  const [waitlistTotal,  setWaitlistTotal]  = useState(0)

  useEffect(() => { document.title = 'Listing \u2014 MasterChef Cuts' }, [])

  useEffect(() => {
    if (listing) {
      const animalLabel = ANIMAL_META[listing.animalType]?.label || ''
      document.title = `${listing.breed} ${animalLabel} \u2014 MasterChef Cuts`

      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.id = 'ld-listing-product'
      script.text = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: `${listing.breed} ${animalLabel}`,
        description: listing.description || `${listing.breed} ${animalLabel} from ${listing.farmerShopName || listing.farmerName}`,
        image: listing.imageUrl || 'https://masterchefcuts.com/og-image.jpg',
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'USD',
          lowPrice: listing.pricePerLb,
          highPrice: listing.pricePerLb,
          availability: listing.status === 'ACTIVE'
            ? 'https://schema.org/InStock'
            : 'https://schema.org/SoldOut',
        },
        brand: { '@type': 'Brand', name: listing.farmerShopName || listing.farmerName || 'MasterChef Cuts' },
      })
      document.getElementById('ld-listing-product')?.remove()
      document.head.appendChild(script)
      return () => script.remove()
    }
  }, [listing])

  useEffect(() => {
    Promise.all([
      api.get(`/api/listings/${id}`),
      api.get(`/api/listings/${id}/reviews`).catch(() => []),
      api.get(`/api/listings/${id}/comments?page=0&size=10`).catch(() => ({ content: [], hasNext: false })),
    ]).then(([l, r, c]) => {
      setListing(l)
      setReviews(r)
      const commentData = Array.isArray(c) ? { content: c, hasNext: false } : c
      setComments(commentData.content || [])
      setHasMoreComments(commentData.hasNext || false)
      setCommentPage(0)
    }).catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!user || user.role === 'farmer') return
    api.get(`/api/reviews/has-reviewed?listingId=${id}`)
      .then(had => setAlreadyReviewed(had))
      .catch(() => {}) // non-critical: review status
  }, [id, user])

  useEffect(() => {
    if (!user || !listing) return
    if (listing.status !== 'FULLY_CLAIMED') return
    api.get(`/api/listings/${listing.id}/waitlist/status`)
      .then(s => { setOnWaitlist(s.onWaitlist || false); setWaitlistTotal(s.total || 0) })
      .catch(() => {})
  }, [listing, user])

  async function handleCutClick(cut) {
    if (!user) { navigate('/login'); return }
    if (user.role === 'farmer') return
    setClaiming(cut.id)
    try {
      const updated = await api.post(`/api/listings/${listing.id}/claims`, { cutId: cut.id })
      setListing(updated)
      cartBridge.addToCart({
        animal: listing.animalType.toLowerCase(),
        cutId:  cut.id,
        name:   cut.label,
        color:  '#f5c97a',
        price:  cut.weightLbs
          ? Math.round(cut.weightLbs * listing.pricePerLb)
          : Math.round(listing.pricePerLb * listing.weightLbs / listing.totalCuts),
        qty:    1,
        listingId: listing.id,
        breed: listing.breed,
        sourceFarm: listing.sourceFarm,
      })
      toast.success(`${cut.label} added to cart!`)
    } catch (err) {
      toast.error(err.message || 'Failed to claim cut.')
    } finally {
      setClaiming(null)
    }
  }

  async function handleSubmitReview(e) {
    e.preventDefault()
    if (!reviewForm.rating) return
    setReviewSubmitting(true)
    try {
      const saved = await api.post('/api/reviews', { listingId: Number(id), rating: reviewForm.rating, comment: reviewForm.comment })
      setReviews(prev => [saved, ...prev])
      setReviewDone(true)
      toast.success('Review submitted!')
    } catch (err) {
      toast.error(err.message || 'Failed to submit review.')
    } finally {
      setReviewSubmitting(false)
    }
  }

  async function handleSubmitComment(e) {
    e.preventDefault()
    if (!commentText.trim()) return
    setCommentSubmitting(true)
    try {
      const saved = await api.post(`/api/listings/${id}/comments`, { body: commentText.trim() })
      setComments(prev => [saved, ...prev])
      setCommentText('')
      toast.success('Comment posted!')
    } catch (err) {
      toast.error(err.message || 'Failed to post comment.')
    } finally {
      setCommentSubmitting(false)
    }
  }

  async function handleDeleteComment(cid) {
    setDeletingComment(cid)
    try {
      await api.delete(`/api/listings/${id}/comments/${cid}`)
      setComments(prev => prev.filter(c => c.id !== cid))
    } catch (err) {
      toast.error(err.message || 'Failed to delete comment.')
    } finally {
      setDeletingComment(null)
    }
  }

  async function handleLoadMoreComments() {
    setLoadingMoreComments(true)
    try {
      const nextPage = commentPage + 1
      const data = await api.get(`/api/listings/${id}/comments?page=${nextPage}&size=10`)
      setComments(prev => [...prev, ...(data.content || [])])
      setHasMoreComments(data.hasNext || false)
      setCommentPage(nextPage)
    } catch (err) {
      toast.error(err.message || 'Failed to load more comments.')
    } finally {
      setLoadingMoreComments(false)
    }
  }

  async function handleWaitlist() {
    if (!user) { navigate('/login'); return }
    setWaitlistLoading(true)
    try {
      if (onWaitlist) {
        await api.delete(`/api/listings/${id}/waitlist`)
        setOnWaitlist(false)
        setWaitlistTotal(t => Math.max(0, t - 1))
        toast.success('Removed from waitlist.')
      } else {
        const res = await api.post(`/api/listings/${id}/waitlist`)
        setOnWaitlist(true)
        setWaitlistTotal(t => t + 1)
        toast.success(res.message || `You're on the waitlist!`)
      }
    } catch (err) {
      toast.error(err.message || 'Waitlist action failed.')
    } finally {
      setWaitlistLoading(false)
    }
  }

  if (loading) return <Spinner />
  if (error)   return <div className="ld-error">{error} <Link to="/listings">← Back</Link></div>
  if (!listing) return null

  const meta      = ANIMAL_META[listing.animalType] || { emoji: '🥩', label: listing.animalType }
  const status    = STATUS_META[listing.status] || { color: '#ccc', label: (listing.status || '').replace(/_/g, ' ') }
  const available = listing.cuts.filter(c => !c.claimed).length
  const claimed   = listing.cuts.filter(c => c.claimed).length
  const pct       = listing.totalCuts > 0 ? Math.round((claimed / listing.totalCuts) * 100) : 0
  const avgRating = reviews.length > 0 ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : null

  return (
    <div className="ld-page">
      <div className="ld-inner">

        <div className="ld-back-row">
          <Link to="/listings" className="ld-back">← Back to Listings</Link>
          <SharePanel listing={listing} />
        </div>

        {/* Hero card */}
        {listing.imageUrl && (
          <div className="ld-photo">
            <img src={listing.imageUrl} alt={`${listing.breed || ''} ${meta.label}`} />
          </div>
        )}
        <div className="ld-hero">
          <div className="ld-hero-left">
            <div className="ld-emoji">{meta.emoji}</div>
            <div>
              <h1 className="ld-title">{listing.breed} {meta.label}</h1>
              <p className="ld-farm">
                <Link to={`/farmer/${listing.farmerId}`} className="ld-farm-link">
                  {listing.farmerShopName || listing.farmerName}
                </Link>
                {' · '}{listing.sourceFarm}
              </p>
              <p className="ld-location">📍 ZIP {listing.zipCode}</p>
            </div>
          </div>
          <div className="ld-hero-right">
            <div className="ld-price">${listing.pricePerLb.toFixed(2)}<small>/lb</small></div>
            <div className="ld-weight">{listing.weightLbs} lbs total</div>
            <div className="ld-status" style={{ color: status.color }}>● {status.label}</div>
          </div>
        </div>

        {/* Stats row */}
        <div className="ld-stats">
          <div className="ld-stat"><strong>{listing.totalCuts}</strong><span>total cuts</span></div>
          <div className="ld-stat-sep" />
          <div className="ld-stat"><strong>{claimed}</strong><span>claimed</span></div>
          <div className="ld-stat-sep" />
          <div className="ld-stat"><strong>{available}</strong><span>available</span></div>
          <div className="ld-stat-sep" />
          <div className="ld-stat"><strong>${(listing.pricePerLb * listing.weightLbs / listing.totalCuts).toFixed(0)}</strong><span>est. per cut</span></div>
          {avgRating !== null && (
            <>
              <div className="ld-stat-sep" />
              <div className="ld-stat"><StarRating value={avgRating} count={reviews.length} /></div>
            </>
          )}
        </div>

        {/* Progress bar */}
        <div className="ld-progress-wrap">
          <div className="ld-progress-header">
            <span>Share progress</span>
            <span>{pct}% claimed</span>
          </div>
          <div className="ld-progress-track">
            {listing.cuts.map((c, i) => (
              <div key={i} className={`ld-seg${c.claimed ? ' ld-seg--claimed' : ''}`} style={{ flex: 1 }}
                title={`${c.label}: ${c.claimed ? 'Claimed' : 'Available'}`} />
            ))}
          </div>
        </div>

        {/* Share with neighbors callout — shown when partially claimed */}
        {available > 0 && claimed > 0 && pct < 100 && (
          <div className="ld-share-neighbors">
            <span className="ld-share-neighbors-icon">🤝</span>
            <div>
              <strong>Help fill this pool!</strong>
              <span> Only {available} cut{available !== 1 ? 's' : ''} left — share with neighbors to get it processed faster.</span>
            </div>
            <SharePanel listing={listing} />
          </div>
        )}

        {listing.description && (
          <p className="ld-description">{listing.description}</p>
        )}

        {listing.processingDate && (
          <div className="ld-processing-badge">
            🗓 Processing date: <strong>{new Date(listing.processingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
          </div>
        )}

        {/* Cuts grid */}
        <div className="ld-cuts-section">
          <h2 className="ld-section-title">Available Cuts</h2>
          {error && <p className="ld-claim-error">{error}</p>}
          <div className="ld-cuts-grid">
            {listing.cuts.map(c => (
              <div key={c.id} className={`ld-cut${c.claimed ? ' ld-cut--claimed' : ''}`}>
                <div className="ld-cut-label">{c.label}</div>
                {c.weightLbs && (
                  <div className="ld-cut-meta">
                    <span className="ld-cut-weight">{c.weightLbs} lbs</span>
                    <span className="ld-cut-price">${Math.round(c.weightLbs * listing.pricePerLb)}</span>
                  </div>
                )}
                {c.claimed ? (
                  <span className="ld-cut-status ld-cut-status--claimed">✓ Claimed</span>
                ) : listing.status === 'ACTIVE' && user?.role !== 'farmer' ? (
                  <button className="ld-cut-claim-btn" onClick={() => handleCutClick(c)} disabled={claiming === c.id}>
                    {claiming === c.id ? '…' : 'Claim →'}
                  </button>
                ) : listing.status === 'ACTIVE' && user?.role === 'farmer' ? (
                  <span className="ld-cut-status ld-cut-status--closed">Farmer account</span>
                ) : (
                  <span className="ld-cut-status ld-cut-status--closed">Unavailable</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Waitlist Banner — shown when listing is FULLY_CLAIMED and user is a buyer */}
        {listing.status === 'FULLY_CLAIMED' && user?.role !== 'farmer' && (
          <div className="ld-waitlist-banner">
            <div className="ld-waitlist-info">
              <span className="ld-waitlist-icon">⏳</span>
              <div>
                <p className="ld-waitlist-title">This listing is fully claimed.</p>
                {waitlistTotal > 0 && (
                  <p className="ld-waitlist-count">{waitlistTotal} {waitlistTotal === 1 ? 'person' : 'people'} on the waitlist</p>
                )}
              </div>
            </div>
            {user ? (
              <button
                className={`ld-waitlist-btn${onWaitlist ? ' ld-waitlist-btn--leave' : ''}`}
                onClick={handleWaitlist}
                disabled={waitlistLoading}
              >
                {waitlistLoading ? '…' : onWaitlist ? 'Leave Waitlist' : 'Join Waitlist'}
              </button>
            ) : (
              <Link to="/login" className="ld-waitlist-btn">Sign in to join waitlist</Link>
            )}
          </div>
        )}

        {/* Reviews section */}
        {reviews.length > 0 && (
          <div className="ld-reviews-section">
            <h2 className="ld-section-title">Participant Reviews</h2>
            <div className="ld-reviews">
              {reviews.map(r => (
                <div key={r.id} className="ld-review">
                  <div className="ld-review-header">
                    <span className="ld-review-stars">
                      {[1,2,3,4,5].map(i => (
                        <span key={i} style={{ color: i <= r.rating ? '#f39c12' : 'rgba(255,255,255,0.2)' }}>★</span>
                      ))}
                    </span>
                    <span className="ld-review-date">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  {r.comment && <p className="ld-review-comment">{r.comment}</p>}
                  <p className="ld-review-author">— {r.buyerName}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leave a Review */}
        {user && user.role !== 'farmer' && listing.status !== 'ACTIVE' && !alreadyReviewed && !reviewDone && (
          <div className="ld-review-form-section">
            <h2 className="ld-section-title">Leave a Review</h2>
            <form className="ld-review-form" onSubmit={handleSubmitReview}>
              <div className="ld-review-stars-row">
                {[1,2,3,4,5].map(n => (
                  <button
                    key={n}
                    type="button"
                    className={`ld-review-star-btn${reviewForm.rating >= n ? ' active' : ''}`}
                    onClick={() => setReviewForm(f => ({ ...f, rating: n }))}
                  >★</button>
                ))}
              </div>
              <textarea
                className="ld-review-comment-input"
                placeholder="Share your experience (optional)…"
                rows={3}
                value={reviewForm.comment}
                onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
              />
              <button
                type="submit"
                className="ld-review-submit-btn"
                disabled={!reviewForm.rating || reviewSubmitting}
              >
                {reviewSubmitting ? 'Submitting…' : 'Submit Review'}
              </button>
            </form>
          </div>
        )}
        {(reviewDone || (alreadyReviewed && user?.role !== 'farmer')) && (
          <div className="ld-review-done">✅ You&apos;ve reviewed this listing. Thank you!</div>
        )}

        {/* Comments section */}
        <div className="ld-comments-section">
          <h2 className="ld-section-title">Comments {comments.length > 0 && <span className="ld-comments-count">({comments.length})</span>}</h2>

          {/* Compose */}
          {user ? (
            <form className="ld-comment-form" onSubmit={handleSubmitComment}>
              <div className="ld-comment-avatar">
                {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div className="ld-comment-compose">
                <textarea
                  className="ld-comment-input"
                  placeholder="Leave a comment…"
                  rows={2}
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  maxLength={1000}
                />
                <div className="ld-comment-compose-footer">
                  <span className="ld-comment-chars">{commentText.length}/1000</span>
                  <button
                    type="submit"
                    className="ld-comment-submit"
                    disabled={!commentText.trim() || commentSubmitting}
                  >
                    {commentSubmitting ? 'Posting…' : 'Post Comment'}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <p className="ld-comment-login-prompt">
              <Link to="/login" className="ld-comment-login-link">Sign in</Link> to leave a comment.
            </p>
          )}

          {/* Comment list */}
          {comments.length === 0 ? (
            <p className="ld-comments-empty">No comments yet. Be the first!</p>
          ) : (
            <div className="ld-comments-list">
              {comments.map(c => (
                <div key={c.id} className="ld-comment">
                  <div className="ld-comment-avatar ld-comment-avatar--sm">
                    {(c.authorName || 'A').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div className="ld-comment-body">
                    <div className="ld-comment-header">
                      <span className="ld-comment-author">{c.authorName || 'Anonymous'}</span>
                      <span className="ld-comment-date">{new Date(c.createdAt).toLocaleDateString()}</span>
                      {user && (user.id === c.authorId || user.role === 'admin') && (
                        <button
                          className="ld-comment-delete"
                          onClick={() => handleDeleteComment(c.id)}
                          disabled={deletingComment === c.id}
                          title="Delete comment"
                        >
                          {deletingComment === c.id ? '…' : '✕'}
                        </button>
                      )}
                    </div>
                    <p className="ld-comment-text">{c.body}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasMoreComments && (
            <div className="ld-comments-load-more">
              <button
                className="ld-comments-load-more-btn"
                onClick={handleLoadMoreComments}
                disabled={loadingMoreComments}
              >
                {loadingMoreComments ? 'Loading…' : 'Load more comments'}
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  )
}
