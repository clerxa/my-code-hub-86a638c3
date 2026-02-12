import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { OnboardingData, CompanyContact } from '@/types/onboarding';
import { Plus, Trash2 } from 'lucide-react';

interface OnboardingStep2Props {
  formData: OnboardingData;
  updateFormData: (data: Partial<OnboardingData>) => void;
}

export const OnboardingStep2 = ({ formData, updateFormData }: OnboardingStep2Props) => {
  const [newContact, setNewContact] = useState<CompanyContact>({
    nom: '',
    email: '',
    telephone: '',
    role_contact: ''
  });

  const addContact = () => {
    if (newContact.nom && newContact.email) {
      updateFormData({ contacts: [...formData.contacts, newContact] });
      setNewContact({ nom: '', email: '', telephone: '', role_contact: '' });
    }
  };

  const removeContact = (index: number) => {
    const updatedContacts = formData.contacts.filter((_, i) => i !== index);
    updateFormData({ contacts: updatedContacts });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Contacts référents
        </h2>
        <p className="text-muted-foreground">
          Ajoutez les personnes à contacter dans votre entreprise
        </p>
      </div>

      <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="contactNom">Nom</Label>
            <Input
              id="contactNom"
              value={newContact.nom}
              onChange={(e) => setNewContact({ ...newContact, nom: e.target.value })}
              placeholder="Jean Dupont"
            />
          </div>
          <div>
            <Label htmlFor="contactEmail">Email</Label>
            <Input
              id="contactEmail"
              type="email"
              value={newContact.email}
              onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
              placeholder="jean.dupont@entreprise.com"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="contactTelephone">Téléphone</Label>
            <Input
              id="contactTelephone"
              value={newContact.telephone}
              onChange={(e) => setNewContact({ ...newContact, telephone: e.target.value })}
              placeholder="+33 6 12 34 56 78"
            />
          </div>
          <div>
            <Label htmlFor="contactRole">Rôle</Label>
            <Input
              id="contactRole"
              value={newContact.role_contact}
              onChange={(e) => setNewContact({ ...newContact, role_contact: e.target.value })}
              placeholder="DRH, Manager, etc."
            />
          </div>
        </div>
        <Button onClick={addContact} variant="outline" className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter ce contact
        </Button>
      </div>

      {formData.contacts.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Contacts ajoutés</h3>
          {formData.contacts.map((contact, index) => (
            <Card key={index} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-foreground">{contact.nom}</p>
                  <p className="text-sm text-muted-foreground">{contact.email}</p>
                  <p className="text-sm text-muted-foreground">{contact.telephone}</p>
                  <p className="text-sm text-muted-foreground">{contact.role_contact}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeContact(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
