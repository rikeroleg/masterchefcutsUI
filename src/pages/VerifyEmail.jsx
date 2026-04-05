// import React, { useState, useEffect } from 'react'
// import { Link, useSearchParams } from 'react-router-dom'
// import { api } from '../api/client'
// import '../styles/auth.css'

// export default function VerifyEmail() {
//   const [searchParams] = useSearchParams()
//   const token = searchParams.get('token')

//   const [status,  setStatus]  = useState('loading') // loading | success | error
//   const [message, setMessage] = useState('')

//   useEffect(() => {
//     if (!token) {
//       setStatus('error')
//       setMessage('No verification token found. Check your email for the correct link.')
//       return
//     }

//     api.get(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
//       .then(() => setStatus('success'))
//       .catch(err => {
//         setStatus('error')
//         setMessage(err.message || 'Invalid or expired verification link.')
//       })
//   }, [token])

//   return (
//     <div className="auth-page">
//       <div className="auth-card">
//         <div className="auth-brand">
//           <span className="auth-brand-icon">&#127859;</span>
//           <span className="auth-brand-name">MasterChef Cuts</span>
//         </div>

//         {status === 'loading' && (
//           <div className="auth-info">
//             <p>Verifying your email&hellip;</p>
//           </div>
//         )}

//         {status === 'success' && (
//           <div className="auth-success-wrap">
//             <div className="auth-success-icon">&#10003;</div>
//             <h2 className="auth-heading">Email verified!</h2>
//             <p className="auth-subtext">Your account is now active. You can sign in and start browsing premium cuts.</p>
//             <Link to="/login" className="auth-submit-btn">Go to Sign In &#8594;</Link>
//           </div>
//         )}

//         {status === 'error' && (
//           <div className="auth-error-wrap">
//             <div className="auth-error-icon">&#10005;</div>
//             <h2 className="auth-heading">Verification failed</h2>
//             <p className="auth-subtext">{message}</p>
//             <Link to="/login" className="auth-submit-btn">Back to Sign In</Link>
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }
