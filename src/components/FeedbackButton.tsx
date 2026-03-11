import { useState } from 'react';
import { Star, MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface FeedbackFormData {
  usefulnessRating: number;
  usageLikelihoodRating: number;
  recommendationRating: number;
  positiveFeedback: string;
  improvementSuggestions: string;
}

const StarRating = ({ 
  rating, 
  onRatingChange, 
  label 
}: { 
  rating: number; 
  onRatingChange: (rating: number) => void; 
  label: string;
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{label}</label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="transition-transform hover:scale-110 focus:outline-none"
          >
            <Star
              size={32}
              className={`${
                star <= (hoverRating || rating)
                  ? 'fill-talendeur-primary text-talendeur-primary'
                  : 'fill-gray-200 text-gray-300'
              } transition-colors`}
            />
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500">
        {rating === 0 && '0 = Not at all, 5 = Extremely'}
        {rating > 0 && rating < 3 && 'Could be better'}
        {rating === 3 && 'Good'}
        {rating > 3 && rating < 5 && 'Very good'}
        {rating === 5 && 'Excellent!'}
      </p>
    </div>
  );
};

export default function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState<FeedbackFormData>({
    usefulnessRating: 0,
    usageLikelihoodRating: 0,
    recommendationRating: 0,
    positiveFeedback: '',
    improvementSuggestions: ''
  });

  const resetForm = () => {
    setFormData({
      usefulnessRating: 0,
      usageLikelihoodRating: 0,
      recommendationRating: 0,
      positiveFeedback: '',
      improvementSuggestions: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to submit feedback",
        variant: "destructive"
      });
      return;
    }

    // Validate that at least one rating is provided
    if (formData.usefulnessRating === 0 && formData.usageLikelihoodRating === 0 && formData.recommendationRating === 0) {
      toast({
        title: "Ratings required",
        description: "Please provide at least one rating",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if user already submitted feedback
      const { data: existingFeedback } = await supabase
        .from('user_feedback')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingFeedback) {
        // Update existing feedback
        const { error } = await supabase
          .from('user_feedback')
          .update({
            usefulness_rating: formData.usefulnessRating || null,
            usage_likelihood_rating: formData.usageLikelihoodRating || null,
            recommendation_rating: formData.recommendationRating || null,
            positive_feedback: formData.positiveFeedback.trim() || null,
            improvement_suggestions: formData.improvementSuggestions.trim() || null,
            user_type: user.userType
          })
          .eq('user_id', user.id);

        if (error) throw error;

        toast({
          title: "Feedback updated!",
          description: "Thank you for updating your feedback. We appreciate your input!"
        });
      } else {
        // Insert new feedback
        const { error } = await supabase
          .from('user_feedback')
          .insert({
            user_id: user.id,
            usefulness_rating: formData.usefulnessRating || null,
            usage_likelihood_rating: formData.usageLikelihoodRating || null,
            recommendation_rating: formData.recommendationRating || null,
            positive_feedback: formData.positiveFeedback.trim() || null,
            improvement_suggestions: formData.improvementSuggestions.trim() || null,
            user_type: user.userType
          });

        if (error) throw error;

        toast({
          title: "Feedback submitted!",
          description: "Thank you for your feedback. We're constantly working to improve Talendeur!"
        });
      }

      setHasSubmitted(true);
      resetForm();
      setIsOpen(false);

    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Submission failed",
        description: "There was an error submitting your feedback. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Feedback Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-6 top-1/2 -translate-y-1/2 z-50 px-6 py-4 rounded-lg shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 flex items-center gap-3 group"
        style={{ backgroundColor: '#9EBC9E', color: '#FFFFFF' }}
        aria-label="Give us feedback"
      >
        <MessageSquare size={24} className="group-hover:rotate-12 transition-transform" />
        <span className="font-semibold text-lg whitespace-nowrap">Give us feedback</span>
      </button>

      {/* Feedback Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-talendeur-primary to-talendeur-orange bg-clip-text text-transparent">
              We'd love your feedback!
            </DialogTitle>
            <DialogDescription>
              Your input helps us make Talendeur better for everyone. This will only take 2 minutes.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            {/* Rating Questions */}
            <div className="space-y-6 p-4 bg-gray-50 rounded-lg">
              <StarRating
                label="How well does Talendeur help you showcase your strengths and find the right match?"
                rating={formData.usefulnessRating}
                onRatingChange={(rating) => setFormData({ ...formData, usefulnessRating: rating })}
              />

              <StarRating
                label="How likely are you to continue using Talendeur?"
                rating={formData.usageLikelihoodRating}
                onRatingChange={(rating) => setFormData({ ...formData, usageLikelihoodRating: rating })}
              />

              <StarRating
                label="How likely are you to recommend Talendeur to a friend or colleague?"
                rating={formData.recommendationRating}
                onRatingChange={(rating) => setFormData({ ...formData, recommendationRating: rating })}
              />
            </div>

            {/* Open Text Questions */}
            <div className="space-y-4">
              <div>
                <label htmlFor="positiveFeedback" className="block text-sm font-medium mb-2">
                  What do you like most about Talendeur?
                </label>
                <Textarea
                  id="positiveFeedback"
                  value={formData.positiveFeedback}
                  onChange={(e) => setFormData({ ...formData, positiveFeedback: e.target.value })}
                  placeholder="Tell us what's working well for you..."
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div>
                <label htmlFor="improvementSuggestions" className="block text-sm font-medium mb-2">
                  What could we improve to make Talendeur better for you?
                </label>
                <Textarea
                  id="improvementSuggestions"
                  value={formData.improvementSuggestions}
                  onChange={(e) => setFormData({ ...formData, improvementSuggestions: e.target.value })}
                  placeholder="Share your ideas for improvement..."
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsOpen(false);
                  resetForm();
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-talendeur-primary to-talendeur-orange hover:opacity-90"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
