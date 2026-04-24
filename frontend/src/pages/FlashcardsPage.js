import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useGamification, XP_VALUES } from '../context/GamificationContext';
import { useToast } from '../components/Toast';
import styles from '../styles/FlashcardsPage.module.css';

// Spaced repetition intervals (days)
const INTERVALS = { again: 0, hard: 1, good: 3, easy: 7 };

function loadDecks() {
  return JSON.parse(localStorage.getItem('tf_flashdecks') || '[]');
}
function saveDecks(decks) {
  localStorage.setItem('tf_flashdecks', JSON.stringify(decks));
}

function getDueCards(deck) {
  const now = Date.now();
  return (deck.cards || []).filter(c => !c.nextReview || c.nextReview <= now);
}

/* ─── Create/Edit Card Modal ─── */
function CardModal({ deckId, card, onSave, onClose }) {
  const [front, setFront] = useState(card?.front || '');
  const [back,  setBack]  = useState(card?.back  || '');

  const save = () => {
    if (!front.trim() || !back.trim()) return;
    onSave(deckId, { ...card, front: front.trim(), back: back.trim() });
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalTitle}>{card ? 'Edit Card' : 'New Flashcard'}</div>
        <label className={styles.label}>Front (question)</label>
        <textarea className={styles.textarea} rows={3} value={front} onChange={e => setFront(e.target.value)} placeholder="What is...?" autoFocus />
        <label className={styles.label}>Back (answer)</label>
        <textarea className={styles.textarea} rows={3} value={back}  onChange={e => setBack(e.target.value)}  placeholder="The answer is..." />
        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.saveBtn}   onClick={save}>Save Card</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Deck Modal ─── */
function DeckModal({ deck, onSave, onClose }) {
  const [name,    setName]    = useState(deck?.name    || '');
  const [subject, setSubject] = useState(deck?.subject || '');
  const [color,   setColor]   = useState(deck?.color   || '#3570d4');
  const COLORS = ['#3570d4','#d95a2e','#27a05a','#b87a14','#9b59b6','#e91e8c','#0891b2','#ef4444'];

  const save = () => { if (!name.trim()) return; onSave({ ...deck, name: name.trim(), subject: subject.trim(), color }); onClose(); };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalTitle}>{deck ? 'Edit Deck' : 'New Deck'}</div>
        <label className={styles.label}>Deck name</label>
        <input className={styles.input} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Biology Chapter 3" autoFocus />
        <label className={styles.label}>Subject (optional)</label>
        <input className={styles.input} value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Biology" />
        <label className={styles.label}>Color</label>
        <div className={styles.colorRow}>
          {COLORS.map(c => (
            <button key={c} className={`${styles.colorDot} ${color===c?styles.colorActive:''}`}
              style={{ background: c }} onClick={() => setColor(c)} />
          ))}
        </div>
        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.saveBtn}   onClick={save}>Save Deck</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Study Session ─── */
function StudySession({ deck, onEnd }) {
  const { addXp, advanceChallenge } = useGamification();
  const [decks, setDecks] = useState(loadDecks);
  const due     = getDueCards(deck);
  const [queue, setQueue] = useState(() => [...due].sort(() => Math.random() - 0.5));
  const [idx,   setIdx]   = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done,  setDone]  = useState(0);
  const [results, setResults] = useState([]);

  const current = queue[idx];

  const rate = useCallback((rating) => {
    const interval = INTERVALS[rating] * 86400000;
    const nextReview = Date.now() + interval;
    // Update card in deck
    const allDecks = loadDecks();
    const di = allDecks.findIndex(d => d.id === deck.id);
    if (di !== -1) {
      const ci = allDecks[di].cards.findIndex(c => c.id === current.id);
      if (ci !== -1) {
        allDecks[di].cards[ci] = { ...allDecks[di].cards[ci], nextReview, lastRating: rating, reviews: (allDecks[di].cards[ci].reviews || 0) + 1 };
        saveDecks(allDecks);
      }
    }
    addXp(XP_VALUES.FLASHCARD_REVIEW, 'Flashcard reviewed');
    advanceChallenge('flash');
    setResults(r => [...r, { ...current, rating }]);
    setDone(d => d + 1);
    setFlipped(false);
    setIdx(i => i + 1);
  }, [current, deck.id, addXp, advanceChallenge]);

  if (!current) {
    const counts = { again: 0, hard: 0, good: 0, easy: 0 };
    results.forEach(r => counts[r.rating]++);
    return (
      <div className={styles.sessionDone}>
        <div className={styles.doneIcon}>🎉</div>
        <div className={styles.doneTitle}>Session Complete!</div>
        <div className={styles.doneStats}>
          {Object.entries(counts).map(([r, n]) => n > 0 && (
            <div key={r} className={`${styles.doneStat} ${styles[`rate_${r}`]}`}>{n} {r}</div>
          ))}
        </div>
        <p className={styles.doneSub}>+{done * XP_VALUES.FLASHCARD_REVIEW} XP earned</p>
        <button className={styles.doneBtn} onClick={onEnd}>Back to decks</button>
      </div>
    );
  }

  return (
    <div className={styles.session}>
      <div className={styles.sessionHeader}>
        <button className={styles.sessionBack} onClick={onEnd}>← Exit</button>
        <div className={styles.sessionProgress}>{idx + 1} / {queue.length}</div>
        <div className={styles.sessionDeck}>{deck.name}</div>
      </div>
      <div className={styles.sessionProgressBar}>
        <div className={styles.sessionProgressFill} style={{ width: `${(idx / queue.length) * 100}%`, background: deck.color }} />
      </div>

      <div className={`${styles.card} ${flipped ? styles.cardFlipped : ''}`} onClick={() => setFlipped(f => !f)}>
        <div className={styles.cardInner}>
          <div className={styles.cardFront}>
            <div className={styles.cardSide}>Question</div>
            <div className={styles.cardText}>{current.front}</div>
            <div className={styles.cardHint}>Tap to reveal answer</div>
          </div>
          <div className={styles.cardBack}>
            <div className={styles.cardSide} style={{ color: deck.color }}>Answer</div>
            <div className={styles.cardText}>{current.back}</div>
          </div>
        </div>
      </div>

      {flipped && (
        <div className={styles.ratingRow}>
          <div className={styles.ratingLabel}>How well did you know this?</div>
          <div className={styles.ratingBtns}>
            {[
              { key: 'again', label: 'Again',    sub: 'Now',    color: '#ef4444' },
              { key: 'hard',  label: 'Hard',     sub: '1 day',  color: '#f97316' },
              { key: 'good',  label: 'Good',     sub: '3 days', color: '#3570d4' },
              { key: 'easy',  label: 'Easy',     sub: '7 days', color: '#22c55e' },
            ].map(r => (
              <button key={r.key} className={styles.ratingBtn}
                style={{ '--rc': r.color }} onClick={() => rate(r.key)}>
                <span className={styles.ratingBtnLabel}>{r.label}</span>
                <span className={styles.ratingBtnSub}>{r.sub}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main page ─── */
export default function FlashcardsPage() {
  const { tasks } = useOutletContext();
  const toast = useToast();

  const [decks,        setDecks]        = useState(loadDecks);
  const [studyDeck,    setStudyDeck]    = useState(null);
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [editDeck,     setEditDeck]     = useState(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [editCard,     setEditCard]     = useState(null);
  const [activeDeckId, setActiveDeckId] = useState(null);
  const [view,         setView]         = useState('decks'); // 'decks' | 'cards'

  const activeDeck = decks.find(d => d.id === activeDeckId);

  const saveDeck = (data) => {
    setDecks(prev => {
      let next;
      if (data.id) {
        next = prev.map(d => d.id === data.id ? { ...d, ...data } : d);
      } else {
        next = [...prev, { ...data, id: Date.now().toString(), cards: [], createdAt: Date.now() }];
      }
      saveDecks(next);
      return next;
    });
    toast.success(data.id ? 'Deck updated!' : 'Deck created!');
  };

  const deleteDeck = (id) => {
    setDecks(prev => { const n = prev.filter(d => d.id !== id); saveDecks(n); return n; });
    setView('decks');
    toast.info('Deck deleted');
  };

  const saveCard = (deckId, cardData) => {
    setDecks(prev => {
      const next = prev.map(d => {
        if (d.id !== deckId) return d;
        const cards = cardData.id
          ? d.cards.map(c => c.id === cardData.id ? cardData : c)
          : [...(d.cards || []), { ...cardData, id: Date.now().toString(), createdAt: Date.now() }];
        return { ...d, cards };
      });
      saveDecks(next);
      return next;
    });
  };

  const deleteCard = (deckId, cardId) => {
    setDecks(prev => {
      const next = prev.map(d => d.id !== deckId ? d : { ...d, cards: d.cards.filter(c => c.id !== cardId) });
      saveDecks(next);
      return next;
    });
  };

  if (studyDeck) {
    return <StudySession deck={studyDeck} onEnd={() => { setStudyDeck(null); setDecks(loadDecks()); }} />;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>🃏 Flashcards</h1>
          <p className={styles.sub}>Spaced repetition for smarter studying</p>
        </div>
        <button className={styles.newDeckBtn} onClick={() => { setEditDeck(null); setShowDeckModal(true); }}>
          + New Deck
        </button>
      </div>

      {view === 'decks' ? (
        <>
          {decks.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>🃏</div>
              <p>No flashcard decks yet.</p>
              <p className={styles.emptySub}>Create a deck and add cards to start studying!</p>
            </div>
          ) : (
            <div className={styles.deckGrid}>
              {decks.map(deck => {
                const due = getDueCards(deck).length;
                return (
                  <div key={deck.id} className={styles.deckCard} style={{ '--dc': deck.color }}>
                    <div className={styles.deckColorBar} style={{ background: deck.color }} />
                    <div className={styles.deckBody}>
                      <div className={styles.deckName}>{deck.name}</div>
                      {deck.subject && <div className={styles.deckSubject}>{deck.subject}</div>}
                      <div className={styles.deckMeta}>
                        <span>{deck.cards?.length || 0} cards</span>
                        {due > 0 && <span className={styles.deckDue}>{due} due</span>}
                      </div>
                    </div>
                    <div className={styles.deckActions}>
                      <button className={styles.deckStudyBtn}
                        disabled={!due}
                        style={due ? { background: deck.color } : {}}
                        onClick={() => setStudyDeck(deck)}>
                        {due > 0 ? `Study (${due})` : 'Up to date ✓'}
                      </button>
                      <button className={styles.deckViewBtn} onClick={() => { setActiveDeckId(deck.id); setView('cards'); }}>
                        View cards
                      </button>
                      <button className={styles.deckMenuBtn} onClick={() => { setEditDeck(deck); setShowDeckModal(true); }}>⋯</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div>
          <div className={styles.cardsHeader}>
            <button className={styles.backBtn} onClick={() => setView('decks')}>← All Decks</button>
            <div className={styles.cardsTitle}>{activeDeck?.name}</div>
            <div className={styles.cardsActions}>
              <button className={styles.addCardBtn} onClick={() => { setEditCard(null); setShowCardModal(true); }}>+ Card</button>
              <button className={styles.deleteDeckBtn} onClick={() => deleteDeck(activeDeckId)}>Delete Deck</button>
            </div>
          </div>

          {(!activeDeck?.cards?.length) ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>📝</div>
              <p>No cards yet. Add your first one!</p>
            </div>
          ) : (
            <div className={styles.cardsList}>
              {activeDeck.cards.map(card => (
                <div key={card.id} className={styles.cardRow}>
                  <div className={styles.cardRowContent}>
                    <div className={styles.cardRowFront}>{card.front}</div>
                    <div className={styles.cardRowBack}>{card.back}</div>
                  </div>
                  <div className={styles.cardRowMeta}>
                    {card.lastRating && <span className={`${styles.ratingTag} ${styles[`rate_${card.lastRating}`]}`}>{card.lastRating}</span>}
                    {card.reviews   && <span className={styles.reviewCount}>{card.reviews} reviews</span>}
                  </div>
                  <div className={styles.cardRowActions}>
                    <button onClick={() => { setEditCard(card); setShowCardModal(true); }}>✏️</button>
                    <button onClick={() => deleteCard(activeDeckId, card.id)}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showDeckModal && (
        <DeckModal deck={editDeck} onSave={saveDeck} onClose={() => setShowDeckModal(false)} />
      )}
      {showCardModal && activeDeckId && (
        <CardModal deckId={activeDeckId} card={editCard} onSave={saveCard} onClose={() => setShowCardModal(false)} />
      )}
    </div>
  );
}
