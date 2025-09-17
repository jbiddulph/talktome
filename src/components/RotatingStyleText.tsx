"use client";

import { useEffect, useMemo, useState } from 'react';

export default function RotatingStyleText() {
    const options = useMemo(
        () => [
            'Rapper',
            'Sports Commentator',
            'Movie Trailer Voice',
            'News Anchor',
            'Stand-Up Comedian',
            'Shakespearean Bard',
            'Fairy Tale Narrator',
            'Conspiracy Theorist',
            'Tech Support Agent',
            'Pet Blogger',
            'Cooking Show Host',
            'Pirate Captain',
            'Poet',
            'Gamer Streamer',
            'Motivational Coach',
            'Sci-Fi Narrator',
            'Gossip Columnist',
        ],
        []
    );
    const [index, setIndex] = useState(() => Math.floor(Math.random() * options.length));
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        const id = setInterval(() => {
            setAnimate(true);
            setTimeout(() => {
                setIndex((i) => (i + 1) % options.length);
                setAnimate(false);
            }, 250);
        }, 2200);
        return () => clearInterval(id);
    }, [options.length]);

    return (
        <span className="inline-block relative overflow-hidden align-baseline" style={{ minWidth: 140 }}>
            <span
                className={
                    'inline-block transition-all duration-200 ' +
                    (animate ? '-translate-y-2 opacity-0' : 'translate-y-0 opacity-100')
                }
            >
                {options[index]}
            </span>
        </span>
    );
}


