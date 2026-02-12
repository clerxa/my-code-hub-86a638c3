import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Edit, Trash2 } from "lucide-react";
import { QuestionWithAnswers } from "@/types/risk-profile";

interface Props {
  questions: QuestionWithAnswers[];
  onQuestionsUpdated: () => void;
}

export const RiskProfileQuestionEditor = ({ questions, onQuestionsUpdated }: Props) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionWithAnswers | null>(null);
  const [formData, setFormData] = useState({
    category: '',
    question_text: '',
    amf_weight: 0,
    order_num: 0,
    answers: [
      { answer_text: '', score_value: 1, order_num: 1 },
      { answer_text: '', score_value: 2, order_num: 2 },
      { answer_text: '', score_value: 3, order_num: 3 },
      { answer_text: '', score_value: 4, order_num: 4 }
    ]
  });

  const openNewQuestion = () => {
    setEditingQuestion(null);
    setFormData({
      category: '',
      question_text: '',
      amf_weight: 0,
      order_num: questions.length + 1,
      answers: [
        { answer_text: '', score_value: 1, order_num: 1 },
        { answer_text: '', score_value: 2, order_num: 2 },
        { answer_text: '', score_value: 3, order_num: 3 },
        { answer_text: '', score_value: 4, order_num: 4 }
      ]
    });
    setEditDialogOpen(true);
  };

  const openEditQuestion = (question: QuestionWithAnswers) => {
    setEditingQuestion(question);
    setFormData({
      category: question.category,
      question_text: question.question_text,
      amf_weight: question.amf_weight,
      order_num: question.order_num,
      answers: question.answers.map(a => ({
        answer_text: a.answer_text,
        score_value: a.score_value,
        order_num: a.order_num
      }))
    });
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingQuestion) {
        // Update existing question
        const { error: questionError } = await supabase
          .from('risk_questions')
          .update({
            category: formData.category,
            question_text: formData.question_text,
            amf_weight: formData.amf_weight,
            order_num: formData.order_num
          })
          .eq('id', editingQuestion.id);

        if (questionError) throw questionError;

        // Update answers
        for (let i = 0; i < formData.answers.length; i++) {
          const answer = formData.answers[i];
          const existingAnswer = editingQuestion.answers[i];
          
          if (existingAnswer) {
            await supabase
              .from('risk_answers')
              .update({
                answer_text: answer.answer_text,
                score_value: answer.score_value,
                order_num: answer.order_num
              })
              .eq('id', existingAnswer.id);
          }
        }

        toast.success("Question mise à jour avec succès");
      } else {
        // Create new question
        const { data: newQuestion, error: questionError } = await supabase
          .from('risk_questions')
          .insert({
            category: formData.category,
            question_text: formData.question_text,
            question_type: 'multiple_choice',
            amf_weight: formData.amf_weight,
            order_num: formData.order_num,
            active: true
          })
          .select()
          .single();

        if (questionError) throw questionError;

        // Create answers
        for (const answer of formData.answers) {
          await supabase
            .from('risk_answers')
            .insert({
              question_id: newQuestion.id,
              answer_text: answer.answer_text,
              score_value: answer.score_value,
              order_num: answer.order_num
            });
        }

        toast.success("Question créée avec succès");
      }

      setEditDialogOpen(false);
      onQuestionsUpdated();
    } catch (error) {
      console.error('Error saving question:', error);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette question ?")) return;

    try {
      // Delete answers first
      await supabase
        .from('risk_answers')
        .delete()
        .eq('question_id', questionId);

      // Delete question
      await supabase
        .from('risk_questions')
        .delete()
        .eq('id', questionId);

      toast.success("Question supprimée avec succès");
      onQuestionsUpdated();
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={openNewQuestion}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une question
        </Button>
      </div>

      <div className="space-y-4">
        {questions.map((question) => (
          <Card key={question.id} className="border">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{question.category}</Badge>
                    <Badge variant="secondary">
                      Poids AMF: {(question.amf_weight * 100).toFixed(0)}%
                    </Badge>
                    <Badge variant={question.active ? "default" : "secondary"}>
                      {question.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <CardTitle className="text-base">
                    {question.question_text}
                  </CardTitle>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditQuestion(question)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(question.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                {question.answers.map((answer) => (
                  <div key={answer.id} className="flex justify-between p-2 rounded hover:bg-muted">
                    <span>{answer.answer_text}</span>
                    <Badge variant="outline">{answer.score_value} pts</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? "Modifier la question" : "Nouvelle question"}
            </DialogTitle>
            <DialogDescription>
              Complétez tous les champs pour {editingQuestion ? "modifier" : "créer"} la question
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Connaissance">Connaissance</SelectItem>
                    <SelectItem value="Expérience">Expérience</SelectItem>
                    <SelectItem value="Objectifs">Objectifs</SelectItem>
                    <SelectItem value="Horizon">Horizon</SelectItem>
                    <SelectItem value="Patrimoine">Patrimoine</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Poids AMF (0-1)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={formData.amf_weight}
                  onChange={(e) => setFormData(prev => ({ ...prev, amf_weight: parseFloat(e.target.value) }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Question</Label>
              <Textarea
                value={formData.question_text}
                onChange={(e) => setFormData(prev => ({ ...prev, question_text: e.target.value }))}
                placeholder="Texte de la question..."
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <Label>Réponses (du risque le plus faible au plus élevé)</Label>
              {formData.answers.map((answer, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Badge variant="outline">{answer.score_value} pt{answer.score_value > 1 ? 's' : ''}</Badge>
                  <Input
                    value={answer.answer_text}
                    onChange={(e) => {
                      const newAnswers = [...formData.answers];
                      newAnswers[index].answer_text = e.target.value;
                      setFormData(prev => ({ ...prev, answers: newAnswers }));
                    }}
                    placeholder={`Réponse ${index + 1}...`}
                  />
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave}>
              {editingQuestion ? "Mettre à jour" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};