"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

import { PIPELINE_NODES } from "../data";

export function ResearchPipeline() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div ref={ref} className="research-pipeline">
      <div className="research-pipeline__track" aria-hidden="true" />
      {PIPELINE_NODES.map((node, index) => (
        <div className="research-pipeline__step" key={node.index}>
          <motion.article
            className={`pipeline-node pipeline-node--${node.tone}`}
            initial={{ opacity: 0, y: 18 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
            transition={{ duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="pipeline-node__topline">
              <span>{node.index}</span>
              <span className="pipeline-node__status">READY</span>
            </div>
            <p className="pipeline-node__label">{node.label}</p>
            <h3>{node.title}</h3>
            <p className="pipeline-node__detail">{node.detail}</p>
            <div className="pipeline-node__artifact">
              <span className="pipeline-node__dot" aria-hidden="true" />
              {node.artifact}
            </div>
          </motion.article>
          {index < PIPELINE_NODES.length - 1 && (
            <motion.span
              className={`pipeline-connector pipeline-connector--${node.tone}`}
              aria-hidden="true"
              initial={{ scaleX: 0, opacity: 0 }}
              animate={isInView ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }}
              transition={{ duration: 0.45, delay: index * 0.08 + 0.2 }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
