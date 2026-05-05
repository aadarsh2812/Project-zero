import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Star, Smile } from 'lucide-react';
import './PostPaymentSuccess.css';

export default function PostPaymentSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const nextSteps = location.state?.nextSteps || 'HOME'; // 'TRACK' or 'HOME'
  const orderId = location.state?.orderId;

  const handleRating = (value: number) => {
    setRating(value);
    // Simulate sending feedback
    setTimeout(() => {
      setSubmitted(true);
    }, 500);
  };

  return (
    <motion.div 
      className="post-payment-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div 
        className="success-check-wrapper"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
      >
        <Check size={40} strokeWidth={3} />
      </motion.div>

      <motion.h1 
        className="thank-you-title"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Payment Successful!
      </motion.h1>
      
      <motion.p 
        className="greeting-desc"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {nextSteps === 'TRACK' 
          ? 'Payment received perfectly. Your order has been securely sent to the kitchen!' 
          : 'Thank you for dining with us! We hope you enjoyed your meal. Please come again soon!'}
      </motion.p>

      <motion.div 
        className="feedback-card"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="feedback-title">How was your experience?</h3>
        
        <div className="stars-container">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              className={`star-btn ${(hoveredRating || rating) >= star ? 'active' : ''}`}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => handleRating(star)}
              disabled={submitted}
            >
              <Star 
                size={34} 
                fill={(hoveredRating || rating) >= star ? "currentColor" : "none"}
                strokeWidth={1.5}
              />
            </button>
          ))}
        </div>

        <div className="feedback-text">
          {submitted ? (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Smile size={18} /> Thank you for your feedback!
            </motion.span>
          ) : (
            <span>Tap a star to rate us</span>
          )}
        </div>
      </motion.div>

      <motion.button 
        className="btn-primary home-btn" 
        onClick={() => {
           if (nextSteps === 'TRACK' && orderId) {
             navigate(`/status/${orderId}`, { replace: true });
           } else {
             navigate('/', { replace: true });
           }
        }}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        {nextSteps === 'TRACK' ? 'Track Order Status' : 'Go to Home Menu'}
      </motion.button>
    </motion.div>
  );
}
