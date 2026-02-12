import { useState } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Plus, Trash2, Copy, CheckCircle2, X, ChevronDown, ChevronUp } from "lucide-react";

interface QuizAnswer {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id: string;
  title: string;
  description?: string;
  explanation?: string;
  points?: number; // Deprecated: points are now managed globally
  type: "single" | "multiple";
  answers: QuizAnswer[];
}

interface QuizEditorProps {
  questions: QuizQuestion[];
  onChange: (questions: QuizQuestion[]) => void;
}

function SortableQuestion({ question, onEdit, onDelete, onDuplicate, isExpanded, onToggleExpand }: {
  question: QuizQuestion;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: question.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const correctAnswersCount = question.answers.filter(a => a.isCorrect).length;

  return (
    <div ref={setNodeRef} style={style} className="mb-3">
      <Card className={isExpanded ? "ring-2 ring-primary" : ""}>
        <CardHeader className="py-3 px-4">
          <div className="flex items-center gap-3">
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 cursor-pointer" onClick={onToggleExpand}>
              <CardTitle className="text-base">{question.title || "Nouvelle question"}</CardTitle>
              <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                <Badge variant="outline">{question.type === "single" ? "Choix unique" : "Choix multiple"}</Badge>
                <Badge variant="outline">{question.answers.length} réponses</Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {correctAnswersCount} correcte{correctAnswersCount > 1 ? "s" : ""}
                </Badge>
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={onToggleExpand}>
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={onDuplicate}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onDelete}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}

function InlineQuestionEditor({ question, onSave, onCancel }: {
  question: QuizQuestion;
  onSave: (question: QuizQuestion) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<QuizQuestion>({ ...question });
  const [errors, setErrors] = useState<{ title?: string; answers?: string; correct?: string }>({});

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = formData.answers.findIndex(a => a.id === active.id);
      const newIndex = formData.answers.findIndex(a => a.id === over.id);
      setFormData({ ...formData, answers: arrayMove(formData.answers, oldIndex, newIndex) });
    }
  };

  const addAnswer = () => {
    setFormData({
      ...formData,
      answers: [...formData.answers, { id: crypto.randomUUID(), text: "", isCorrect: false }]
    });
  };

  const updateAnswer = (id: string, text: string) => {
    setFormData({
      ...formData,
      answers: formData.answers.map(a => a.id === id ? { ...a, text } : a)
    });
    if (errors.answers) setErrors(prev => ({ ...prev, answers: undefined }));
  };

  const toggleCorrect = (id: string) => {
    setFormData({
      ...formData,
      answers: formData.answers.map(a => {
        if (formData.type === "single") {
          return { ...a, isCorrect: a.id === id };
        } else {
          return a.id === id ? { ...a, isCorrect: !a.isCorrect } : a;
        }
      })
    });
    if (errors.correct) setErrors(prev => ({ ...prev, correct: undefined }));
  };

  const deleteAnswer = (id: string) => {
    if (formData.answers.length <= 2) return;
    setFormData({
      ...formData,
      answers: formData.answers.filter(a => a.id !== id)
    });
  };

  const handleSubmit = () => {
    const newErrors: { title?: string; answers?: string; correct?: string } = {};
    
    if (!formData.title.trim()) {
      newErrors.title = "Le titre est requis";
    }
    if (formData.answers.some(a => !a.text.trim())) {
      newErrors.answers = "Toutes les réponses doivent avoir un texte";
    }
    if (!formData.answers.some(a => a.isCorrect)) {
      newErrors.correct = "Au moins une réponse doit être marquée comme correcte";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onSave(formData);
  };

  return (
    <Card className="mb-3 border-primary bg-muted/30">
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">Édition de la question</h4>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Titre de la question *</Label>
            <Input
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                if (errors.title) setErrors(prev => ({ ...prev, title: undefined }));
              }}
              placeholder="Ex: Quelle est la différence entre un PEE et un PERCO ?"
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title && <p className="text-sm text-destructive mt-1">{errors.title}</p>}
          </div>

          <div>
            <Label>Description (optionnelle)</Label>
            <Textarea
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Contexte ou précisions supplémentaires..."
              rows={2}
            />
          </div>

          <div>
            <Label>Explication de la bonne réponse (optionnelle)</Label>
            <Textarea
              value={formData.explanation || ""}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              placeholder="Cette explication sera affichée après une bonne réponse..."
              rows={2}
            />
          </div>

          <div>
            <Label>Type de question *</Label>
            <RadioGroup
              value={formData.type}
              onValueChange={(value: "single" | "multiple") => setFormData({ ...formData, type: value })}
              className="flex gap-4 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single" id={`single-${formData.id}`} />
                <Label htmlFor={`single-${formData.id}`} className="font-normal">Choix unique</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="multiple" id={`multiple-${formData.id}`} />
                <Label htmlFor={`multiple-${formData.id}`} className="font-normal">Choix multiple</Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <Label>Réponses * (glissez pour réorganiser)</Label>
            <Button type="button" variant="outline" size="sm" onClick={addAnswer}>
              <Plus className="h-4 w-4 mr-1" />
              Ajouter
            </Button>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={formData.answers.map(a => a.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {formData.answers.map((answer) => (
                  <SortableAnswer
                    key={answer.id}
                    answer={answer}
                    questionType={formData.type}
                    onUpdate={updateAnswer}
                    onToggleCorrect={toggleCorrect}
                    onDelete={deleteAnswer}
                    canDelete={formData.answers.length > 2}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          {errors.answers && <p className="text-sm text-destructive">{errors.answers}</p>}
          {errors.correct && <p className="text-sm text-destructive">{errors.correct}</p>}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="button" size="sm" onClick={handleSubmit}>
            Enregistrer la question
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SortableAnswer({ answer, questionType, onUpdate, onToggleCorrect, onDelete, canDelete }: {
  answer: QuizAnswer;
  questionType: "single" | "multiple";
  onUpdate: (id: string, text: string) => void;
  onToggleCorrect: (id: string) => void;
  onDelete: (id: string) => void;
  canDelete: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: answer.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2">
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      
      {questionType === "single" ? (
        <RadioGroup value={answer.isCorrect ? answer.id : ""} onValueChange={() => onToggleCorrect(answer.id)}>
          <RadioGroupItem value={answer.id} id={answer.id} />
        </RadioGroup>
      ) : (
        <Checkbox checked={answer.isCorrect} onCheckedChange={() => onToggleCorrect(answer.id)} />
      )}
      
      <Input
        value={answer.text}
        onChange={(e) => onUpdate(answer.id, e.target.value)}
        placeholder="Texte de la réponse"
        className="flex-1"
      />
      
      {canDelete && (
        <Button type="button" variant="ghost" size="sm" onClick={() => onDelete(answer.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export function QuizEditor({ questions, onChange }: QuizEditorProps) {
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex(q => q.id === active.id);
      const newIndex = questions.findIndex(q => q.id === over.id);
      onChange(arrayMove(questions, oldIndex, newIndex));
    }
  };

  const handleSaveQuestion = (question: QuizQuestion) => {
    if (isAddingNew) {
      onChange([...questions, question]);
      setIsAddingNew(false);
    } else {
      onChange(questions.map(q => q.id === question.id ? question : q));
      setEditingQuestionId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingQuestionId(null);
    setIsAddingNew(false);
  };

  const handleDeleteQuestion = (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette question ?")) return;
    onChange(questions.filter(q => q.id !== id));
    if (editingQuestionId === id) {
      setEditingQuestionId(null);
    }
  };

  const handleDuplicateQuestion = (id: string) => {
    const question = questions.find(q => q.id === id);
    if (!question) return;
    const duplicated: QuizQuestion = {
      ...question,
      id: crypto.randomUUID(),
      title: `${question.title} (copie)`,
      answers: question.answers.map(a => ({ ...a, id: crypto.randomUUID() }))
    };
    onChange([...questions, duplicated]);
  };

  const handleAddNew = () => {
    setIsAddingNew(true);
    setEditingQuestionId(null);
  };

  const newQuestion: QuizQuestion = {
    id: crypto.randomUUID(),
    title: "",
    description: "",
    explanation: "",
    type: "single",
    answers: [
      { id: crypto.randomUUID(), text: "", isCorrect: false },
      { id: crypto.randomUUID(), text: "", isCorrect: false },
    ],
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base">Questions du quiz</Label>
          <p className="text-sm text-muted-foreground mt-1">
            {questions.length} question{questions.length > 1 ? "s" : ""}
          </p>
        </div>
        <Button type="button" onClick={handleAddNew} disabled={isAddingNew}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une question
        </Button>
      </div>

      {/* New question form */}
      {isAddingNew && (
        <InlineQuestionEditor
          question={newQuestion}
          onSave={handleSaveQuestion}
          onCancel={handleCancelEdit}
        />
      )}

      {/* Existing questions */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
          <div>
            {questions.length === 0 && !isAddingNew ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Aucune question. Commencez par en ajouter une.
                </CardContent>
              </Card>
            ) : (
              questions.map((question) => (
                editingQuestionId === question.id ? (
                  <InlineQuestionEditor
                    key={question.id}
                    question={question}
                    onSave={handleSaveQuestion}
                    onCancel={handleCancelEdit}
                  />
                ) : (
                  <SortableQuestion
                    key={question.id}
                    question={question}
                    isExpanded={false}
                    onToggleExpand={() => setEditingQuestionId(question.id)}
                    onEdit={() => setEditingQuestionId(question.id)}
                    onDelete={() => handleDeleteQuestion(question.id)}
                    onDuplicate={() => handleDuplicateQuestion(question.id)}
                  />
                )
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
