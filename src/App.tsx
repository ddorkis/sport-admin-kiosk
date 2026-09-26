import React, { useState, useEffect } from 'react';
import {
  Persona,
  Tesserato,
  Gruppo,
  GruppoTesserato,
  Quota,
  Pagamento,
  Utente,
  Anno,
  SpesaPrevisionale
} from './types';
import {
  getInitialState,
  saveState,
  generaQuotePerIscrizione,
  isQuotaScaduta,
  sincronizzaQuoteAnnualiPerTutti
} from './utils/storage';

// Viste Kiosk e Gestionale
import { KioskView } from './components/kiosk/KioskView';
import { Sidebar } from './components/common/Sidebar';
import { DashboardView } from './components/gestionale/DashboardView';
import { PersoneView } from './components/gestionale/PersoneView';
import { TesseratiView } from './components/gestionale/TesseratiView';
import { GruppiView } from './components/gestionale/GruppiView';
import { QuoteView } from './components/gestionale/QuoteView';
import { PrevisioneSpeseView } from './components/gestionale/PrevisioneSpeseView';
import { PagamentiView } from './components/gestionale/PagamentiView';
import { UtentiView } from './components/gestionale/UtentiView';
import { AssociazioneView } from './components/gestionale/AssociazioneView';

// Modali Operative
import { NuovaPersonaModal } from './components/modals/NuovaPersonaModal';
import { NuovoTesseramentoModal } from './components/modals/NuovoTesseramentoModal';
import { IscrizioneGruppoModal } from './components/modals/IscrizioneGruppoModal';
import { RegistraPagamentoModal } from './components/modals/RegistraPagamentoModal';
import { CercaAnagraficaModal } from './components/modals/CercaAnagraficaModal';
import { GestioneAnnoModal } from './components/modals/GestioneAnnoModal';
import { CodeExportModal } from './components/code_export/CodeExportModal';
import { StampaDocumentoModal, TipoDocumentoStampa } from './components/modals/StampaDocumentoModal';
import { DisiscrizioneAtletaModal } from './components/modals/DisiscrizioneAtletaModal';
import { AnnullaQuotaModal } from './components/modals/AnnullaQuotaModal';

// Pagine di Inserimento a Schermo Intero (Nuova Navigazione Senza Dialog)
import { NuovaPersonaPage } from './components/gestionale/NuovaPersonaPage';
import { NuovoTesseramentoPage } from './components/gestionale/NuovoTesseramentoPage';
import { NuovoPagamentoPage } from './components/gestionale/NuovoPagamentoPage';
import { NuovoGruppoPage } from './components/gestionale/NuovoGruppoPage';
import { NuovaIscrizioneGruppoPage } from './components/gestionale/NuovaIscrizioneGruppoPage';
import { NuovoUtentePage } from './components/gestionale/NuovoUtentePage';
import { NuovaSpesaPage } from './components/gestionale/NuovaSpesaPage';
import { SinotticoConsiglioDirettivoPage } from './components/gestionale/SinotticoConsiglioDirettivoPage';

// Auth
import { LoginPage } from './components/auth/LoginPage';

export default function App() {
  const [data, setData] = useState(getInitialState);
  const [currentUser, setCurrentUser] = useState<Utente | null>(data.utenti[0]); // default admin
  const [currentMode, setCurrentMode] = useState<'kiosk' | 'gestionale'>('gestionale');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [quoteFilter, setQuoteFilter] = useState<string | undefined>(undefined);
  const [spesaToEdit, setSpesaToEdit] = useState<SpesaPrevisionale | null>(null);

  // Modali state
  const [isNuovaPersonaOpen, setIsNuovaPersonaOpen] = useState(false);
  const [isTesseramentoOpen, setIsTesseramentoOpen] = useState(false);
  const [preselectedPersonaForTess, setPreselectedPersonaForTess] = useState<number | undefined>(undefined);
  const [personaToEdit, setPersonaToEdit] = useState<Persona | null>(null);

  const [isIscrizioneGruppoOpen, setIsIscrizioneGruppoOpen] = useState(false);
  const [preselectedTesseratoForGruppo, setPreselectedTesseratoForGruppo] = useState<number | undefined>(undefined);

  const [isPagamentoOpen, setIsPagamentoOpen] = useState(false);
  const [preselectedTesseratoForPagamento, setPreselectedTesseratoForPagamento] = useState<number | undefined>(undefined);
  const [preselectedQuotaForPagamento, setPreselectedQuotaForPagamento] = useState<number | undefined>(undefined);

  const [isCercaAnagraficaOpen, setIsCercaAnagraficaOpen] = useState(false);
  const [isGestioneAnnoOpen, setIsGestioneAnnoOpen] = useState(false);
  const [isCodeExportOpen, setIsCodeExportOpen] = useState(false);

  // Ritiro Atleta / Disiscrizione e Annulla Quota
  const [disiscrizioneTesseratoId, setDisiscrizioneTesseratoId] = useState<number | null>(null);
  const [quotaToAnnullare, setQuotaToAnnullare] = useState<Quota | null>(null);

  // Stampa Documenti Ufficiali
  const [stampaModal, setStampaModal] = useState<{
    isOpen: boolean;
    tipo: TipoDocumentoStampa;
    persona?: Persona;
    tesserato?: Tesserato;
    pagamento?: Pagamento;
    gruppi?: Gruppo[];
  }>({
    isOpen: false,
    tipo: 'ricevuta'
  });

  const handlePrintRicevuta = (pag: Pagamento) => {
    const tess = data.tesserati.find((t) => t.id === pag.tesserato_id);
    const pers = tess ? data.persone.find((p) => p.id === tess.persona_id) : undefined;
    setStampaModal({
      isOpen: true,
      tipo: 'ricevuta',
      pagamento: pag,
      tesserato: tess,
      persona: pers
    });
  };

  const handlePrintDomandaIscrizione = (tessId: number) => {
    const tess = data.tesserati.find((t) => t.id === tessId);
    if (!tess) return;
    const pers = data.persone.find((p) => p.id === tess.persona_id);
    const grpIds = data.gruppi_tesserati.filter((gt) => gt.tesserato_id === tess.id).map((gt) => gt.gruppo_id);
    const grps = data.gruppi.filter((g) => grpIds.includes(g.id));
    setStampaModal({
      isOpen: true,
      tipo: 'domanda_iscrizione',
      tesserato: tess,
      persona: pers,
      gruppi: grps
    });
  };

  const handlePrintRichiestaCertificato = (tessId: number) => {
    const tess = data.tesserati.find((t) => t.id === tessId);
    if (!tess) return;
    const pers = data.persone.find((p) => p.id === tess.persona_id);
    const grpIds = data.gruppi_tesserati.filter((gt) => gt.tesserato_id === tess.id).map((gt) => gt.gruppo_id);
    const grps = data.gruppi.filter((g) => grpIds.includes(g.id));
    setStampaModal({
      isOpen: true,
      tipo: 'richiesta_certificato',
      tesserato: tess,
      persona: pers,
      gruppi: grps
    });
  };

  const handlePrintDemoFromAssociazione = (tipo: TipoDocumentoStampa) => {
    const sampleTess = data.tesserati[0];
    const samplePers = sampleTess ? data.persone.find((p) => p.id === sampleTess.persona_id) : data.persone[0];
    const samplePag = data.pagamenti[0];
    const grpIds = sampleTess ? data.gruppi_tesserati.filter((gt) => gt.tesserato_id === sampleTess.id).map((gt) => gt.gruppo_id) : [];
    const grps = data.gruppi.filter((g) => grpIds.includes(g.id));

    setStampaModal({
      isOpen: true,
      tipo,
      tesserato: sampleTess,
      persona: samplePers,
      pagamento: samplePag,
      gruppi: grps.length > 0 ? grps : [data.gruppi[0]]
    });
  };

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Salva nello storage quando cambia il dato
  useEffect(() => {
    saveState(data);
  }, [data]);

  const annoAttivo = data.anni.find((a) => a.attivo) || data.anni[0];
  const quoteScaduteCount = data.quote.filter(isQuotaScaduta).length;

  // Login Handler con verifica flag is_kiosk
  const handleLogin = (user: Utente) => {
    setCurrentUser(user);
    if (user.is_kiosk) {
      setCurrentMode('kiosk');
      showToast(`Accesso effettuato: Modalità KIOSK attivata per ${user.nome}!`);
    } else {
      setCurrentMode('gestionale');
      setActiveTab('dashboard');
      showToast(`Benvenuto nel Gestionale Amministrativo, ${user.nome}!`);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // Cambio Anno Sportivo Attivo
  const handleSelectAnno = (annoId: number) => {
    setData((prev) => {
      const updatedAnni = prev.anni.map((a) => ({
        ...a,
        attivo: a.id === annoId
      }));
      const nuovoAttivo = updatedAnni.find((a) => a.id === annoId);
      showToast(`Anno sportivo di lavoro impostato su ${nuovoAttivo?.anno}`);
      return {
        ...prev,
        anni: updatedAnni
      };
    });
  };

  // Creazione Nuovo Anno Sportivo
  const handleCreateAnno = (newAnnoData: Omit<Anno, 'id'>) => {
    const nextId = Math.max(0, ...data.anni.map((a) => a.id)) + 1;
    const newAnno: Anno = {
      ...newAnnoData,
      id: nextId
    };

    setData((prev) => {
      let updatedAnni = [...prev.anni];
      if (newAnno.attivo) {
        updatedAnni = updatedAnni.map((a) => ({ ...a, attivo: false }));
      }
      return {
        ...prev,
        anni: [...updatedAnni, newAnno]
      };
    });

    showToast(`Nuovo anno sportivo ${newAnno.anno} creato con successo!`);
  };

  // Gestione Creazione Persona (con o senza tutore)
  const handleSavePersona = (newPersonaData: Omit<Persona, 'id' | 'data_creazione'>): Persona => {
    const nextId = Math.max(0, ...data.persone.map((p) => p.id)) + 1;
    const newPersona: Persona = {
      ...newPersonaData,
      id: nextId,
      data_creazione: new Date().toISOString()
    };

    setData((prev) => ({
      ...prev,
      persone: [newPersona, ...prev.persone]
    }));

    showToast(`Persona ${newPersona.nome} ${newPersona.cognome} registrata con successo!`);
    return newPersona;
  };

  // Gestione Modifica Persona Esistente
  const handleUpdatePersona = (updatedPersona: Persona) => {
    setData((prev) => ({
      ...prev,
      persone: prev.persone.map((p) => (p.id === updatedPersona.id ? updatedPersona : p))
    }));

    showToast(`Dati anagrafici di ${updatedPersona.cognome} ${updatedPersona.nome} aggiornati con successo!`);
  };

  // Eliminazione Definitiva Persona (solo se non ha pagamenti/ricevute fiscali)
  const handleDeletePersona = (personaId: number) => {
    const tessIds = data.tesserati.filter((t) => t.persona_id === personaId).map((t) => t.id);
    const hasPagamenti = data.pagamenti.some((p) => tessIds.includes(p.tesserato_id));
    if (hasPagamenti) {
      showToast('Impossibile eliminare: ricevute fiscali presenti (obbligo conservazione 10 anni ex art. 2220 C.C.). Procedi con Anonimizzazione GDPR.');
      return;
    }

    setData((prev) => ({
      ...prev,
      persone: prev.persone.filter((p) => p.id !== personaId),
      tesserati: prev.tesserati.filter((t) => t.persona_id !== personaId),
      gruppi_tesserati: prev.gruppi_tesserati.filter((gt) => !tessIds.includes(gt.tesserato_id)),
      quote: prev.quote.filter((q) => !tessIds.includes(q.tesserato_id))
    }));
    showToast('Anagrafica eliminata definitivamente dal sistema.');
  };

  // Archiviazione / Ripristino Persona (Soft Delete / Nascondi)
  const handleToggleArchivePersona = (personaId: number, archive: boolean) => {
    setData((prev) => ({
      ...prev,
      persone: prev.persone.map((p) => (p.id === personaId ? { ...p, attivo: !archive } : p))
    }));
    showToast(archive ? 'Anagrafica archiviata (nascosta dalle liste ordinarie e dal Kiosk).' : 'Anagrafica ripristinata tra i soci attivi!');
  };

  // Anonimizzazione Dati Personali a norma GDPR (Art. 17 Diritto all\'Oblio con conservazione ricevute ex art. 2220 C.C.)
  const handleAnonymizePersona = (personaId: number) => {
    setData((prev) => ({
      ...prev,
      persone: prev.persone.map((p) => {
        if (p.id !== personaId) return p;
        return {
          ...p,
          nome: 'ANONIMO',
          cognome: `GDPR #${p.id}`,
          codice_fiscale: `ANON${String(p.id).padStart(12, '0')}`,
          luogo_nascita: '',
          indirizzo: '',
          citta: '',
          telefono: '',
          email: '',
          is_minorenne: false,
          tutore_nome: undefined,
          tutore_cognome: undefined,
          tutore_cf: undefined,
          tutore_telefono: undefined,
          tutore_email: undefined,
          tutore_relazione: undefined,
          note: `Dati personali e dati tutore cancellati a norma dell'Art. 17 GDPR (Diritto all'Oblio). Estremi contabili conservati ai sensi dell'art. 2220 C.C. in data ${new Date().toISOString().substring(0, 10)}.`,
          attivo: false,
          anonimizzato_gdpr: true,
          data_anonimizzazione: new Date().toISOString()
        };
      })
    }));
    showToast("Dati personali e tutore anonimizzati ex Art. 17 GDPR. Ricevute contabili conservate a norma di legge.");
  };

  // Gestione Tesseramento
  const handleSaveTesseramento = (tessData: {
    persona_id: number;
    anno_id: number;
    numero_tessera: string;
    tipo_tesseramento: Tesserato['tipo_tesseramento'];
    certificato_medico_scadenza: string;
    gruppo_id?: number | null;
  }) => {
    const nextId = Math.max(0, ...data.tesserati.map((t) => t.id)) + 1;
    const newTess: Tesserato = {
      id: nextId,
      persona_id: tessData.persona_id,
      anno_id: tessData.anno_id,
      numero_tessera: tessData.numero_tessera,
      tipo_tesseramento: tessData.tipo_tesseramento,
      certificato_medico_scadenza: tessData.certificato_medico_scadenza,
      data_tesseramento: new Date().toISOString().substring(0, 10),
      stato: 'Attivo'
    };

    let nuoveQuote: Quota[] = [];
    let updatedGruppiTess = [...data.gruppi_tesserati];

    if (tessData.gruppo_id) {
      const gruppo = data.gruppi.find((g) => g.id === tessData.gruppo_id);
      if (gruppo) {
        const nextGtId = Math.max(0, ...data.gruppi_tesserati.map((gt) => gt.id)) + 1;
        updatedGruppiTess.push({
          id: nextGtId,
          gruppo_id: gruppo.id,
          tesserato_id: newTess.id,
          data_iscrizione: new Date().toISOString().substring(0, 10),
          note: 'Iscritto durante tesseramento'
        });
        nuoveQuote = generaQuotePerIscrizione(gruppo, newTess.id, data.quote);
      }
    }

    setData((prev) => ({
      ...prev,
      tesserati: [newTess, ...prev.tesserati],
      gruppi_tesserati: updatedGruppiTess,
      quote: [...nuoveQuote, ...prev.quote]
    }));

    showToast(`Tesseramento ${newTess.numero_tessera} registrato con successo!`);
  };

  // Gestione Iscrizione a Gruppo & Generazione Automatica Quote
  const handleSaveIscrizioneGruppo = (tesseratoId: number, gruppoId: number) => {
    const gruppo = data.gruppi.find((g) => g.id === gruppoId);
    if (!gruppo) return;

    const nextId = Math.max(0, ...data.gruppi_tesserati.map((gt) => gt.id)) + 1;
    const newGruppoTesserato: GruppoTesserato = {
      id: nextId,
      gruppo_id: gruppoId,
      tesserato_id: tesseratoId,
      data_iscrizione: new Date().toISOString().substring(0, 10),
      note: 'Iscritto da interfaccia'
    };

    // Generazione automatica di tutte le rate mensili previste per il corso
    const nuoveQuote = generaQuotePerIscrizione(gruppo, tesseratoId, data.quote);

    setData((prev) => ({
      ...prev,
      gruppi_tesserati: [newGruppoTesserato, ...prev.gruppi_tesserati],
      quote: [...nuoveQuote, ...prev.quote]
    }));

    showToast(`Atleta iscritto a ${gruppo.nome_gruppo} e generate ${nuoveQuote.length} quote mensili!`);
  };

  // Generazione quote di massa per un gruppo
  const handleGeneraQuotePerGruppo = (gruppoId: number) => {
    const gruppo = data.gruppi.find((g) => g.id === gruppoId);
    if (!gruppo) return;

    const iscritti = data.gruppi_tesserati.filter((gt) => gt.gruppo_id === gruppoId);
    if (iscritti.length === 0) {
      alert('Nessun atleta iscritto a questo gruppo. Iscrivi prima gli atleti.');
      return;
    }

    let nuoveTotali: Quota[] = [];
    let currentQuoteList = [...data.quote];

    iscritti.forEach((gt) => {
      const generated = generaQuotePerIscrizione(gruppo, gt.tesserato_id, currentQuoteList);
      nuoveTotali = [...nuoveTotali, ...generated];
      currentQuoteList = [...generated, ...currentQuoteList];
    });

    if (nuoveTotali.length === 0) {
      alert('Tutte le quote mensili per gli atleti di questo gruppo risultano già generate!');
      return;
    }

    setData((prev) => ({
      ...prev,
      quote: [...nuoveTotali, ...prev.quote]
    }));

    showToast(`Generate con successo ${nuoveTotali.length} nuove quote mensili per ${gruppo.nome_gruppo}!`);
  };

  // Creazione Nuovo Gruppo
  const handleCreaNuovoGruppo = (gruppoData: Omit<Gruppo, 'id'>) => {
    const nextId = Math.max(0, ...data.gruppi.map((g) => g.id)) + 1;
    const nuovoGruppo: Gruppo = {
      ...gruppoData,
      id: nextId
    };

    setData((prev) => ({
      ...prev,
      gruppi: [nuovoGruppo, ...prev.gruppi]
    }));

    showToast(`Nuovo gruppo ${nuovoGruppo.nome_gruppo} creato!`);
  };

  // Registrazione Incasso / Saldo Quota
  const handleSavePagamento = (pagData: {
    tesserato_id: number;
    quota_id?: number | null;
    importo: number;
    metodo_pagamento: Pagamento['metodo_pagamento'];
    causale: string;
    note?: string;
  }) => {
    const nextId = Math.max(0, ...data.pagamenti.map((p) => p.id)) + 1;
    const currentYear = new Date().getFullYear();
    const ricevutaNumero = `RIC-${currentYear}-${String(nextId).padStart(4, '0')}`;
    const dateStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const newPagamento: Pagamento = {
      id: nextId,
      tesserato_id: pagData.tesserato_id,
      quota_id: pagData.quota_id || null,
      importo: Number(pagData.importo),
      data_pagamento: dateStr,
      metodo_pagamento: pagData.metodo_pagamento,
      causale: pagData.causale,
      ricevuta_numero: ricevutaNumero,
      note: pagData.note || ''
    };

    // Aggiornamento eventuale quota collegata
    let updatedQuote = [...data.quote];
    if (newPagamento.quota_id) {
      updatedQuote = updatedQuote.map((q) => {
        if (q.id === newPagamento.quota_id) {
          const importoPagatoNuovo = (q.importo_pagato || 0) + newPagamento.importo;
          const nuovoStato: Quota['stato'] =
            importoPagatoNuovo >= q.importo ? 'pagata' : 'parziale';
          return {
            ...q,
            importo_pagato: importoPagatoNuovo,
            stato: nuovoStato
          };
        }
        return q;
      });
    }

    setData((prev) => ({
      ...prev,
      pagamenti: [newPagamento, ...prev.pagamenti],
      quote: updatedQuote
    }));

    showToast(`Pagamento di € ${newPagamento.importo.toFixed(2)} registrato (${ricevutaNumero})!`);
  };

  // Gestione Disiscrizione Atleta da Corso / Ritiro con Sgravio Quote Future
  const handleConfirmDisiscrizione = (payload: {
    tesseratoId: number;
    gruppoId?: number;
    disiscriviDaTutti: boolean;
    dataRitiro: string;
    motivo: string;
    annullaQuoteFuture: boolean;
    sospendiTessera: boolean;
  }) => {
    // 1. Rimuovi iscrizione dal gruppo o da tutti i gruppi
    const updatedGruppiTesserati = data.gruppi_tesserati.filter((gt) => {
      if (gt.tesserato_id !== payload.tesseratoId) return true;
      if (payload.disiscriviDaTutti) return false;
      if (payload.gruppoId && gt.gruppo_id === payload.gruppoId) return false;
      return true;
    });

    // 2. Annulla quote future non saldate se richiesto
    let annullateCount = 0;
    const updatedQuote = data.quote.map((q) => {
      if (q.tesserato_id !== payload.tesseratoId) return q;
      if (q.stato === 'pagata' || q.stato === 'annullata') return q;
      if (!payload.disiscriviDaTutti && payload.gruppoId && q.gruppo_id !== payload.gruppoId) return q;

      if (payload.annullaQuoteFuture && q.data_scadenza >= payload.dataRitiro) {
        annullateCount++;
        return {
          ...q,
          stato: 'annullata' as const,
          note: `Annullata per ritiro/disiscrizione dal ${payload.dataRitiro} (${payload.motivo})`
        };
      }
      return q;
    });

    // 3. Aggiorna stato tessera se richiesto
    const updatedTesserati = data.tesserati.map((t) => {
      if (t.id === payload.tesseratoId && payload.sospendiTessera) {
        return { ...t, stato: 'Sospeso' as const };
      }
      return t;
    });

    setData((prev) => ({
      ...prev,
      gruppi_tesserati: updatedGruppiTesserati,
      quote: updatedQuote,
      tesserati: updatedTesserati
    }));

    const msg = `Disiscrizione registrata! ${annullateCount > 0 ? `${annullateCount} quote future sgravate/annullate.` : ''}`;
    showToast(msg);
  };

  // Gestione Annullamento Singola Quota
  const handleConfirmAnnullaQuota = (quotaId: number, motivazione: string) => {
    setData((prev) => ({
      ...prev,
      quote: prev.quote.map((q) =>
        q.id === quotaId
          ? {
              ...q,
              stato: 'annullata' as const,
              note: `Annullata: ${motivazione}`
            }
          : q
      )
    }));

    showToast('Quota annullata con successo!');
  };

  // Gestione Spese Previsionali & Bilancio
  const handleSaveSpesa = (spesaData: Omit<SpesaPrevisionale, 'id'>, idToEdit?: number) => {
    setData((prev) => {
      let nuoveSpese: SpesaPrevisionale[];
      const listaSpese = prev.spese || [];
      if (idToEdit) {
        nuoveSpese = listaSpese.map((s) => (s.id === idToEdit ? { ...spesaData, id: idToEdit } : s));
      } else {
        const nextId = listaSpese.reduce((max, s) => Math.max(max, s.id), 0) + 1;
        nuoveSpese = [...listaSpese, { ...spesaData, id: nextId }];
      }
      return { ...prev, spese: nuoveSpese };
    });
    showToast(idToEdit ? 'Voce di spesa modificata con successo!' : 'Nuova voce di spesa aggiunta al budget!');
  };

  const handleDeleteSpesa = (id: number) => {
    setData((prev) => ({
      ...prev,
      spese: (prev.spese || []).filter((s) => s.id !== id)
    }));
    showToast('Voce di spesa rimossa dal budget.');
  };

  const handleSincronizzaQuote = () => {
    const { quoteAggiornate, numeroNuoveQuote } = sincronizzaQuoteAnnualiPerTutti(
      data.gruppi_tesserati,
      data.gruppi,
      data.quote
    );
    setData((prev) => ({ ...prev, quote: quoteAggiornate }));
    if (numeroNuoveQuote > 0) {
      showToast(`Scadenziario sincronizzato: generate ${numeroNuoveQuote} nuove rate mensili!`);
    } else {
      showToast('Tutte le quote per i corsisti attivi sono già calcolate e sincronizzate.');
    }
  };

  // Gestione Utenti
  const handleToggleKioskFlag = (userId: number) => {
    setData((prev) => ({
      ...prev,
      utenti: prev.utenti.map((u) => (u.id === userId ? { ...u, is_kiosk: !u.is_kiosk } : u))
    }));
    showToast('Flag modalità Kiosk aggiornato!');
  };

  const handleCreaUtente = (newUserData: Omit<Utente, 'id'>) => {
    const nextId = Math.max(0, ...data.utenti.map((u) => u.id)) + 1;
    const newUser: Utente = {
      ...newUserData,
      id: nextId
    };

    setData((prev) => ({
      ...prev,
      utenti: [...prev.utenti, newUser]
    }));

    showToast(`Utente ${newUser.username} creato con successo!`);
  };

  // Se nessun utente è autenticato, mostra pagina di Login
  if (!currentUser) {
    return (
      <>
        <LoginPage
          utenti={data.utenti}
          onLogin={handleLogin}
          onOpenCodeExport={() => setIsCodeExportOpen(true)}
        />
        <CodeExportModal
          isOpen={isCodeExportOpen}
          onClose={() => setIsCodeExportOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="min-vh-100 bg-light d-flex flex-column font-sans">
      {/* Toast Notifiche */}
      {toastMessage && (
        <div
          className="position-fixed bottom-0 end-0 p-3"
          style={{ zIndex: 1090 }}
        >
          <div className="toast show align-items-center text-white bg-success border-0 shadow-lg rounded-3">
            <div className="d-flex">
              <div className="toast-body d-flex align-items-center">
                <i className="bi bi-check-circle-fill me-2 fs-5"></i>
                {toastMessage}
              </div>
              <button
                type="button"
                className="btn-close btn-close-white me-2 m-auto"
                onClick={() => setToastMessage(null)}
              ></button>
            </div>
          </div>
        </div>
      )}

      {/* RENDER MODALITÀ KIOSK O GESTIONALE */}
      {currentMode === 'kiosk' ? (
        <KioskView
          user={currentUser}
          annoAttivo={annoAttivo}
          persone={data.persone}
          tesserati={data.tesserati}
          gruppi={data.gruppi}
          quote={data.quote}
          pagamenti={data.pagamenti}
          onOpenNuovaPersona={() => setIsNuovaPersonaOpen(true)}
          onOpenTesseramento={() => {
            setPreselectedPersonaForTess(undefined);
            setIsTesseramentoOpen(true);
          }}
          onOpenIscrizioneGruppo={() => {
            setPreselectedTesseratoForGruppo(undefined);
            setIsIscrizioneGruppoOpen(true);
          }}
          onOpenPagamento={() => {
            setPreselectedTesseratoForPagamento(undefined);
            setPreselectedQuotaForPagamento(undefined);
            setIsPagamentoOpen(true);
          }}
          onOpenCercaAnagrafica={() => setIsCercaAnagraficaOpen(true)}
          onOpenGestioneAnno={() => setIsGestioneAnnoOpen(true)}
          onSwitchToGestionale={() => setCurrentMode('gestionale')}
          onOpenCodeExport={() => setIsCodeExportOpen(true)}
          onLogout={handleLogout}
        />
      ) : (
        <div className="d-flex flex-column flex-md-row min-vh-100 bg-light">
          {/* Menu Laterale (sempre aperto su monitor PC / Desktop, compresso con pulsante hamburger su mobile / schermi compatti) */}
          <Sidebar
            user={currentUser}
            annoAttivo={annoAttivo}
            anni={data.anni}
            onSelectAnno={handleSelectAnno}
            onOpenGestioneAnno={() => setIsGestioneAnnoOpen(true)}
            activeTab={activeTab}
            onSelectTab={(tab) => {
              setActiveTab(tab);
              setQuoteFilter(undefined);
            }}
            onSwitchToKiosk={() => setCurrentMode('kiosk')}
            onOpenCodeExport={() => setIsCodeExportOpen(true)}
            quoteScaduteCount={quoteScaduteCount}
            onLogout={handleLogout}
          />

          {/* Contenuto Gestionale in base alla tab attiva */}
          <main className="flex-grow-1 overflow-auto" style={{ minWidth: 0 }}>
            {activeTab === 'dashboard' && (
              <DashboardView
                annoAttivo={annoAttivo}
                persone={data.persone}
                tesserati={data.tesserati}
                gruppi={data.gruppi}
                quote={data.quote}
                pagamenti={data.pagamenti}
                onNavigateTab={(tab, filter) => {
                  setActiveTab(tab);
                  if (filter) setQuoteFilter(filter);
                }}
                onOpenPagamento={(tessId, quotaId) => {
                  setPreselectedTesseratoForPagamento(tessId);
                  setPreselectedQuotaForPagamento(quotaId);
                  setActiveTab('nuovo_pagamento');
                }}
                onOpenNuovaPersona={() => setActiveTab('nuova_persona')}
              />
            )}

            {activeTab === 'persone' && (
              <PersoneView
                persone={data.persone}
                tesserati={data.tesserati}
                pagamenti={data.pagamenti}
                quote={data.quote}
                onOpenNuovaPersona={() => {
                  setPersonaToEdit(null);
                  setActiveTab('nuova_persona');
                }}
                onTesseraPersona={(p) => {
                  setPreselectedPersonaForTess(p.id);
                  setActiveTab('nuovo_tesseramento');
                }}
                onModificaPersona={(p) => {
                  setPersonaToEdit(p);
                  setActiveTab('nuova_persona');
                }}
                onDeletePermanent={handleDeletePersona}
                onToggleArchive={handleToggleArchivePersona}
                onAnonymizeGdpr={handleAnonymizePersona}
              />
            )}

            {activeTab === 'nuova_persona' && (
              <NuovaPersonaPage
                initialPersona={personaToEdit}
                onBack={() => {
                  setPersonaToEdit(null);
                  setActiveTab('persone');
                }}
                onSave={(persona) => {
                  const saved = handleSavePersona(persona);
                  setPersonaToEdit(null);
                  setActiveTab('persone');
                  return saved;
                }}
                onUpdate={(persona) => {
                  handleUpdatePersona(persona);
                  setPersonaToEdit(null);
                  setActiveTab('persone');
                }}
                onSavedAndTessera={(persona) => {
                  setPersonaToEdit(null);
                  setPreselectedPersonaForTess(persona.id);
                  setActiveTab('nuovo_tesseramento');
                }}
              />
            )}

            {activeTab === 'tesserati' && (
              <TesseratiView
                persone={data.persone}
                tesserati={data.tesserati}
                anni={data.anni}
                gruppi={data.gruppi}
                gruppiTesserati={data.gruppi_tesserati}
                quote={data.quote}
                onOpenNuovoTesseramento={() => {
                  setPreselectedPersonaForTess(undefined);
                  setActiveTab('nuovo_tesseramento');
                }}
                onOpenIscrizioneGruppo={(tessId) => {
                  setPreselectedTesseratoForGruppo(tessId);
                  setActiveTab('iscrizione_gruppo');
                }}
                onOpenPagamento={(tessId) => {
                  setPreselectedTesseratoForPagamento(tessId);
                  setPreselectedQuotaForPagamento(undefined);
                  setActiveTab('nuovo_pagamento');
                }}
                onViewQuotes={(tessId) => {
                  setActiveTab('quote');
                }}
                onModificaPersona={(p) => {
                  setPersonaToEdit(p);
                  setActiveTab('nuova_persona');
                }}
                onOpenDisiscrizione={(tessId) => {
                  setDisiscrizioneTesseratoId(tessId);
                }}
                onPrintDomandaIscrizione={handlePrintDomandaIscrizione}
                onPrintRichiestaCertificato={handlePrintRichiestaCertificato}
              />
            )}

            {activeTab === 'nuovo_tesseramento' && (
              <NuovoTesseramentoPage
                onBack={() => setActiveTab('tesserati')}
                persone={data.persone}
                anni={data.anni}
                gruppi={data.gruppi}
                tesseratiEsistenti={data.tesserati}
                preselectedPersonaId={preselectedPersonaForTess}
                onOpenNuovaPersona={() => setActiveTab('nuova_persona')}
                onSave={(tessData) => {
                  handleSaveTesseramento(tessData);
                  setActiveTab('tesserati');
                }}
              />
            )}

            {activeTab === 'gruppi' && (
              <GruppiView
                gruppi={data.gruppi}
                gruppiTesserati={data.gruppi_tesserati}
                tesserati={data.tesserati}
                persone={data.persone}
                anni={data.anni}
                quote={data.quote}
                onGeneraQuotePerGruppo={handleGeneraQuotePerGruppo}
                onOpenNuovoGruppo={() => setActiveTab('nuovo_gruppo')}
                onOpenIscrizioneGruppo={() => {
                  setPreselectedTesseratoForGruppo(undefined);
                  setActiveTab('iscrizione_gruppo');
                }}
                onOpenDisiscrizione={(tessId) => {
                  setDisiscrizioneTesseratoId(tessId);
                }}
              />
            )}

            {activeTab === 'nuovo_gruppo' && (
              <NuovoGruppoPage
                onBack={() => setActiveTab('gruppi')}
                anni={data.anni}
                onSave={(grp) => {
                  handleCreaNuovoGruppo(grp);
                  setActiveTab('gruppi');
                }}
              />
            )}

            {activeTab === 'iscrizione_gruppo' && (
              <NuovaIscrizioneGruppoPage
                onBack={() => setActiveTab('gruppi')}
                tesserati={data.tesserati}
                persone={data.persone}
                gruppi={data.gruppi}
                preselectedTesseratoId={preselectedTesseratoForGruppo}
                onSave={(iscr) => {
                  handleSaveIscrizioneGruppo(iscr.tesserato_id, iscr.gruppo_id);
                  setActiveTab('gruppi');
                }}
              />
            )}

            {activeTab === 'quote' && (
              <QuoteView
                quote={data.quote}
                tesserati={data.tesserati}
                persone={data.persone}
                gruppi={data.gruppi}
                initialFilter={quoteFilter}
                onOpenPagamento={(tessId, quotaId) => {
                  setPreselectedTesseratoForPagamento(tessId);
                  setPreselectedQuotaForPagamento(quotaId);
                  setActiveTab('nuovo_pagamento');
                }}
                onAnnullaQuota={(q) => {
                  setQuotaToAnnullare(q);
                }}
                onNavigateToBilancio={() => {
                  setActiveTab('previsioni');
                }}
                onSincronizzaQuote={handleSincronizzaQuote}
              />
            )}

            {activeTab === 'previsioni' && (
              <PrevisioneSpeseView
                annoAttivo={annoAttivo}
                quote={data.quote}
                gruppi={data.gruppi}
                spese={data.spese || []}
                associazione={data.associazione}
                onSaveSpesa={handleSaveSpesa}
                onDeleteSpesa={handleDeleteSpesa}
                onNavigateTab={(tab, filter) => {
                  if (filter) setQuoteFilter(filter);
                  setActiveTab(tab);
                }}
                onOpenNuovaSpesa={(spesa) => {
                  setSpesaToEdit(spesa || null);
                  setActiveTab('nuova_spesa');
                }}
                onOpenSinotticoCd={() => {
                  setActiveTab('sinottico_cd');
                }}
              />
            )}

            {activeTab === 'nuova_spesa' && (
              <NuovaSpesaPage
                initialSpesa={spesaToEdit}
                annoAttivo={annoAttivo}
                onBack={() => {
                  setSpesaToEdit(null);
                  setActiveTab('previsioni');
                }}
                onSave={(spesa, idToEdit) => {
                  handleSaveSpesa(spesa, idToEdit);
                  setSpesaToEdit(null);
                  setActiveTab('previsioni');
                }}
              />
            )}

            {activeTab === 'sinottico_cd' && (
              <SinotticoConsiglioDirettivoPage
                associazione={data.associazione}
                annoAttivo={annoAttivo}
                quote={data.quote}
                spese={data.spese || []}
                gruppi={data.gruppi}
                onBack={() => setActiveTab('previsioni')}
              />
            )}

            {activeTab === 'pagamenti' && (
              <PagamentiView
                pagamenti={data.pagamenti}
                tesserati={data.tesserati}
                persone={data.persone}
                quote={data.quote}
                associazione={data.associazione}
                onOpenNuovoPagamento={() => {
                  setPreselectedTesseratoForPagamento(undefined);
                  setPreselectedQuotaForPagamento(undefined);
                  setActiveTab('nuovo_pagamento');
                }}
                onOpenStampaUfficiale={handlePrintRicevuta}
              />
            )}

            {activeTab === 'nuovo_pagamento' && (
              <NuovoPagamentoPage
                onBack={() => setActiveTab('pagamenti')}
                persone={data.persone}
                tesserati={data.tesserati}
                quote={data.quote}
                associazione={data.associazione}
                preselectedQuotaId={preselectedQuotaForPagamento}
                preselectedTesseratoId={preselectedTesseratoForPagamento}
                onSave={(pagData) => {
                  handleSavePagamento(pagData);
                  setActiveTab('pagamenti');
                }}
              />
            )}

            {activeTab === 'utenti' && (
              <UtentiView
                utenti={data.utenti}
                currentUser={currentUser}
                onToggleKioskFlag={handleToggleKioskFlag}
                onOpenNuovoUtente={() => setActiveTab('nuovo_utente')}
                onSwitchUser={(u) => handleLogin(u)}
              />
            )}

            {activeTab === 'nuovo_utente' && (
              <NuovoUtentePage
                onBack={() => setActiveTab('utenti')}
                onSave={(u) => {
                  handleCreaUtente(u);
                  setActiveTab('utenti');
                }}
              />
            )}

            {activeTab === 'associazione' && (
              <AssociazioneView
                associazione={data.associazione}
                onSaveAssociazione={(updated) => {
                  setData((prev) => ({ ...prev, associazione: updated }));
                  showToast('Dati dell\'Associazione aggiornati con successo!');
                }}
                onOpenStampaDemo={handlePrintDemoFromAssociazione}
              />
            )}
          </main>
        </div>
      )}

      {/* MODALI CONDIVISI */}
      <NuovaPersonaModal
        isOpen={isNuovaPersonaOpen}
        onClose={() => setIsNuovaPersonaOpen(false)}
        onSave={handleSavePersona}
        isKioskMode={currentMode === 'kiosk'}
      />

      <NuovoTesseramentoModal
        isOpen={isTesseramentoOpen}
        onClose={() => setIsTesseramentoOpen(false)}
        persone={data.persone}
        tesseratiEsistenti={data.tesserati}
        gruppi={data.gruppi}
        anni={data.anni}
        preselectedPersonaId={preselectedPersonaForTess}
        onSave={handleSaveTesseramento}
        isKioskMode={currentMode === 'kiosk'}
      />

      <IscrizioneGruppoModal
        isOpen={isIscrizioneGruppoOpen}
        onClose={() => setIsIscrizioneGruppoOpen(false)}
        tesserati={data.tesserati}
        persone={data.persone}
        gruppi={data.gruppi}
        preselectedTesseratoId={preselectedTesseratoForGruppo}
        onSave={handleSaveIscrizioneGruppo}
        isKioskMode={currentMode === 'kiosk'}
      />

      <RegistraPagamentoModal
        isOpen={isPagamentoOpen}
        onClose={() => setIsPagamentoOpen(false)}
        tesserati={data.tesserati}
        persone={data.persone}
        quote={data.quote}
        preselectedTesseratoId={preselectedTesseratoForPagamento}
        preselectedQuotaId={preselectedQuotaForPagamento}
        onSave={handleSavePagamento}
        isKioskMode={currentMode === 'kiosk'}
      />

      <CercaAnagraficaModal
        isOpen={isCercaAnagraficaOpen}
        onClose={() => setIsCercaAnagraficaOpen(false)}
        persone={data.persone}
        tesserati={data.tesserati}
        gruppi={data.gruppi}
        gruppiTesserati={data.gruppi_tesserati}
        quote={data.quote}
        pagamenti={data.pagamenti}
        onOpenPagamento={(tessId, quotaId) => {
          setPreselectedTesseratoForPagamento(tessId);
          setPreselectedQuotaForPagamento(quotaId);
          setIsPagamentoOpen(true);
        }}
        isKioskMode={currentMode === 'kiosk'}
      />

      <GestioneAnnoModal
        isOpen={isGestioneAnnoOpen}
        onClose={() => setIsGestioneAnnoOpen(false)}
        anni={data.anni}
        annoAttivo={annoAttivo}
        onSelectAnno={handleSelectAnno}
        onCreateAnno={handleCreateAnno}
        isKioskMode={currentMode === 'kiosk'}
      />

      <CodeExportModal
        isOpen={isCodeExportOpen}
        onClose={() => setIsCodeExportOpen(false)}
      />

      <StampaDocumentoModal
        isOpen={stampaModal.isOpen}
        onClose={() => setStampaModal((prev) => ({ ...prev, isOpen: false }))}
        tipoDocumento={stampaModal.tipo}
        associazione={data.associazione}
        persona={stampaModal.persona}
        tesserato={stampaModal.tesserato}
        pagamento={stampaModal.pagamento}
        annoAttivo={annoAttivo}
        gruppi={stampaModal.gruppi}
      />

      {/* Modale Disiscrizione / Ritiro Atleta */}
      {disiscrizioneTesseratoId && (() => {
        const tess = data.tesserati.find((t) => t.id === disiscrizioneTesseratoId);
        const pers = tess ? data.persone.find((p) => p.id === tess.persona_id) : null;
        if (!tess || !pers) return null;
        return (
          <DisiscrizioneAtletaModal
            isOpen={true}
            onClose={() => setDisiscrizioneTesseratoId(null)}
            tesserato={tess}
            persona={pers}
            gruppi={data.gruppi}
            gruppiTesserati={data.gruppi_tesserati}
            quote={data.quote}
            onConfirmDisiscrizione={handleConfirmDisiscrizione}
          />
        );
      })()}

      {/* Modale Annulla Singola Quota */}
      {quotaToAnnullare && (() => {
        const tess = data.tesserati.find((t) => t.id === quotaToAnnullare.tesserato_id);
        const pers = tess ? data.persone.find((p) => p.id === tess.persona_id) : null;
        return (
          <AnnullaQuotaModal
            isOpen={true}
            onClose={() => setQuotaToAnnullare(null)}
            quota={quotaToAnnullare}
            persona={pers}
            tesserato={tess}
            onConfirmAnnulla={handleConfirmAnnullaQuota}
          />
        );
      })()}
    </div>
  );
}
