import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, MessageCircle, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useCurrentUser } from '../hooks/useCurrentUser';

export default function TenderQA({ tender, tenderId }) {
  const { isAdmin, partnerId } = useCurrentUser();
  const [newQuestion, setNewQuestion] = useState('');
  const [answeringQuestionId, setAnsweringQuestionId] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const queryClient = useQueryClient();

  const askQuestionMutation = useMutation({
    mutationFn: async (question) => {
      const updatedQuestions = [
        ...(tender.questions || []),
        {
          partner_id: partnerId,
          question,
          asked_at: new Date().toISOString(),
          answer: null,
          answered_at: null,
        }
      ];
      return base44.entities.Tender.update(tenderId, { questions: updatedQuestions });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tender', tenderId]);
      setNewQuestion('');
    },
  });

  const answerQuestionMutation = useMutation({
    mutationFn: async ({ questionIndex, answer }) => {
      const updatedQuestions = [...(tender.questions || [])];
      updatedQuestions[questionIndex] = {
        ...updatedQuestions[questionIndex],
        answer,
        answered_at: new Date().toISOString(),
      };
      return base44.entities.Tender.update(tenderId, { questions: updatedQuestions });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tender', tenderId]);
      setAnsweringQuestionId(null);
      setAnswerText('');
    },
  });

  const handleAskQuestion = () => {
    if (newQuestion.trim()) {
      askQuestionMutation.mutate(newQuestion.trim());
    }
  };

  const handleAnswerQuestion = (questionIndex) => {
    if (answerText.trim()) {
      answerQuestionMutation.mutate({ questionIndex, answer: answerText.trim() });
    }
  };

  // Filter questions for partner view (only show their own)
  const visibleQuestions = isAdmin 
    ? tender.questions || []
    : (tender.questions || []).filter(q => q.partner_id === partnerId);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Questions & Answers
        </CardTitle>
        <p className="text-sm text-slate-600 mt-1">
          {isAdmin 
            ? 'All questions from partners. Partner details are private and not shared with other partners.'
            : 'Ask questions about this tender. Your identity remains private to other partners.'}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Ask Question Form (Partners only) */}
        {!isAdmin && tender.status !== 'cancelled' && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm font-semibold text-blue-900 mb-2">Ask a Question</div>
            <Textarea
              placeholder="Type your question here..."
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              className="mb-3 bg-white"
              rows={3}
            />
            <Button
              onClick={handleAskQuestion}
              disabled={!newQuestion.trim() || askQuestionMutation.isPending}
              className="bg-blue-900 hover:bg-blue-800"
              size="sm"
            >
              <Send className="w-4 h-4 mr-2" />
              {askQuestionMutation.isPending ? 'Sending...' : 'Send Question'}
            </Button>
          </div>
        )}

        {/* Questions List */}
        {visibleQuestions.length > 0 ? (
          <div className="space-y-4">
            {visibleQuestions.map((qa, idx) => {
              const actualIndex = isAdmin 
                ? idx 
                : tender.questions.findIndex(q => q === qa);
              
              return (
                <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  {/* Question */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-semibold text-blue-900">
                          {isAdmin ? 'Partner Question' : 'Your Question'}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {format(new Date(qa.asked_at), 'MMM d, yyyy HH:mm')}
                        </Badge>
                      </div>
                      {!qa.answer && (
                        <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                      {qa.answer && (
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Answered
                        </Badge>
                      )}
                    </div>
                    <p className="text-slate-700 pl-6">{qa.question}</p>
                  </div>

                  {/* Answer Section */}
                  {qa.answer ? (
                    <div className="pl-6 pt-3 border-t border-slate-200">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-semibold text-green-900">ASSA ABLOY Response</span>
                        <Badge variant="outline" className="text-xs">
                          {format(new Date(qa.answered_at), 'MMM d, yyyy HH:mm')}
                        </Badge>
                      </div>
                      <p className="text-slate-700 pl-6">{qa.answer}</p>
                    </div>
                  ) : isAdmin ? (
                    <div className="pl-6 pt-3 border-t border-slate-200">
                      {answeringQuestionId === actualIndex ? (
                        <div className="space-y-2">
                          <Textarea
                            placeholder="Type your answer..."
                            value={answerText}
                            onChange={(e) => setAnswerText(e.target.value)}
                            className="bg-white"
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleAnswerQuestion(actualIndex)}
                              disabled={!answerText.trim() || answerQuestionMutation.isPending}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              {answerQuestionMutation.isPending ? 'Posting...' : 'Post Answer'}
                            </Button>
                            <Button
                              onClick={() => {
                                setAnsweringQuestionId(null);
                                setAnswerText('');
                              }}
                              variant="outline"
                              size="sm"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          onClick={() => setAnsweringQuestionId(actualIndex)}
                          variant="outline"
                          size="sm"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Answer Question
                        </Button>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <div className="text-sm">
              {isAdmin 
                ? 'No questions submitted yet'
                : 'No questions yet. Be the first to ask!'}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}