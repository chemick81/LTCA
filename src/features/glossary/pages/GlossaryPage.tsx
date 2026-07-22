import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

// V1 : contenu statique. TODO: migrer vers une table `glossary_terms` si l'Admin
// doit pouvoir l'éditer (non trancher dans le brief — à valider).
const TERMS: { term: string; definition: string }[] = [
  { term: 'Extension', definition: 'Phase de mouvement directionnel fort du prix, premier temps de la méthode EPB.' },
  { term: 'Poussée', definition: 'Accélération du mouvement confirmant la direction après l\'extension.' },
  { term: 'Blocage', definition: 'Zone de résistance ou de retournement marquant la fin du mouvement.' },
  { term: 'Support', definition: 'Niveau de prix où la pression acheteuse a historiquement freiné une baisse.' },
  { term: 'Résistance', definition: 'Niveau de prix où la pression vendeuse a historiquement freiné une hausse.' },
];

export function GlossaryPage() {
  const [query, setQuery] = useState('');
  const filtered = TERMS.filter((t) => t.term.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Glossaire</h1>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un terme..."
          className="pl-9"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((item) => (
          <Card key={item.term}>
            <CardContent className="pt-6">
              <p className="font-semibold text-primary">{item.term}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.definition}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
