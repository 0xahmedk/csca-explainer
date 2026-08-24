// Sections that have been written carry their final prose. The rest are still
// placeholder-grade: enough to set the rhythm and length of each section.

export const SECTIONS = [
  {
    id: 'threat',
    navLabel: 'Why it matters',
    heading: 'What cache side-channel attacks are, and why they matter in cloud tenancy',
    paragraphs: [
      'A cloud provider earns its margin by placing many customers on one physical CPU. That is the business model, not a misconfiguration. Renting a virtual machine buys you a share of a machine, and you are never told who holds the other shares.',
      'Take a concrete case. A bank runs its payment service in a cloud virtual machine. An attacker rents the cheapest instance on offer and, with a little patience, lands on the same physical server. Every isolation boundary a reader would think to check is present and working: two separate virtual machines, two separate operating systems, separate memory, a hypervisor between them, firewalls around them. None of it is broken, and none of it will be.',
      'Underneath all of that sits one piece of hardware that both tenants use, the last level cache on the CPU they share. It is below the layer the isolation controls operate on, so none of those controls has anything to say about it. And because access to that cache is faster when the data is already present, one tenant’s activity leaves a trace in timing that a neighbour can read. That is the whole of the mechanism this section needs.',
      'The consequence is out of proportion to how small it sounds. A neighbouring tenant can recover secrets from that trace, including the bank’s private TLS signing key, without crossing a boundary, exploiting a bug, or producing a single log entry. Conventional defences see nothing, because by their own definitions nothing happened.',
    ],
    figure: {
      component: 'isolation',
      label: 'Figure 1',
      caption:
        'The isolation is genuine. The virtual machines, the operating systems, the memory separation and the firewalls all hold, and nothing here is bypassed. The leak happens one layer below them, in a physical cache that the security controls do not model and cannot see.',
    },
    afterFigure: [
      'How that timing trace is actually read, and how an attacker turns it into key material, is the subject of the next section.',
    ],
  },
  {
    id: 'mechanics',
    navLabel: 'How attacks work',
    accent: true,
    heading: 'How the attacks work: Prime+Probe and Flush+Reload',
    paragraphs: [
      'Both techniques below do the same thing. The attacker puts the cache into a state it chose, waits, then measures how long its own memory accesses take. The measurement is the entire observation. At no point does the attacker read the victim\u2019s data.',
      'Step through each one and watch the cache set change. The steps differ, the shape does not.',
    ],
    figure: {
      component: 'attack',
      label: 'Figure 2',
      caption:
        'The same four beats in both cases: arrange the cache, wait, time your own access, interpret the number. What separates the two is what the attacker arranges and which direction the timing points. Neither technique reads the victim\u2019s data, and neither needs a software bug.',
    },
    table: {
      title: 'The two side by side',
      columns: ['', 'Prime+Probe', 'Flush+Reload'],
      rows: [
        ['Shared memory required', 'No', 'Yes, from a shared library or host deduplication'],
        ['What it localises', 'A whole cache set, so many addresses at once', 'One specific cache line'],
        ['Victim activity looks like', 'A slow measurement', 'A fast measurement'],
      ],
    },
    afterFigure: [
      'The two differ in what they need and in how sharply they see. Prime+Probe works against any victim sharing the CPU, because it requires nothing shared between them, but it localises activity only to a cache set, and a great many different addresses map to the same set. Flush+Reload needs a line the two parties genuinely share, which in practice means a shared library or memory deduplication on the host, and in exchange it names the exact line the victim touched.',
      'The direction of the signal is reversed between them. Under Prime+Probe a slow measurement means the victim was active. Under Flush+Reload a fast measurement means it. An attacker picks between them based on what the host makes available.',
      'A third variant, Flush+Flush, is quieter still. It is included in this study\u2019s dataset and is not covered here.',
    ],
  },
  {
    id: 'detection',
    navLabel: 'Detection today',
    heading: 'How detection works today, and what prior work has achieved',
    paragraphs: [
      'The attacks in the previous section write nothing to a log, because nothing they do is a policy violation. They are not invisible, though. Filling a cache set, flushing a line and timing thousands of accesses disturbs the cache in ways that are measurable, and the processor is already counting cache events in hardware for its own reasons.',
      'Every modern Intel CPU exposes those hardware performance counters: cache misses, cache references, cache hits, retired instructions, readable through perf at whatever interval you ask for. So the defence reads the counters continuously and hands short windows of them to a classifier, which answers one question. Does this pattern look like an attack?',
    ],
    figure: {
      component: 'pipeline',
      label: 'Figure 3',
      caption:
        'The detector end to end, running on an idle machine. The attacker\u2019s probe loop and the video compression service separate cleanly once each window is reduced to its summary statistics, and both verdicts are correct. On an attack the response starts on its own, without an operator in the loop.',
    },
    afterFigure: [
      'The figure shows where the classifier sits, but not why one is needed. The reason is that there is no single counter value that means attack. Cache miss rates vary enormously across ordinary programs. A database scan or a graph traversal misses far more often than a compression service does, and some ordinary programs miss more often than an attacker does. A fixed rule written by hand either lets real attacks through or fires on everyday software, and nobody can write down the number that would separate them.',
      'What does separate them is a combination across several counters at once. Misses, references, hits and instruction counts move together in a particular way during a probe loop, and that joint pattern is far easier to learn from labelled examples than to specify in advance. Try setting the rule by hand and see.',
    ],
    aside: {
      component: 'threshold',
      label: 'Try it',
      caption:
        'Ten programs, seven ordinary and three attacks. Every counter puts some ordinary program on the wrong side of every cut. A model reading all four together does not have to choose one axis, which is the whole reason the pipeline has a classifier in it.',
    },
    closing: [
      'Labelled examples are unusually cheap to produce for this problem. A researcher runs a known attack and records the counters, runs known benign software and records the counters, and repeats. The labels are certain, because the researcher decided what was running. A large and clean training set is straightforward to build, which is exactly the situation supervised learning suits.',
      'Tree based ensembles are the standard choice for that data. Random Forest and XGBoost handle a small set of numeric summary features well, they train in minutes, and they are fast enough at inference to run continuously against live counter data, which a real time detector requires.',
      'Deep learning enters as the natural next step, on the expectation that a learned model can capture more than hand chosen summary statistics. That is the direction Joshi et al. [[2]] take.',
    ],
    sources: {
      title: 'Prior work',
      entries: [
        {
          title: 'Ghabbara and Trifa',
          meta: 'ICIW 2025, PDF',
          ref: 1,
          href: 'https://personales.upv.es/thinkmind/dl/conferences/iciw/iciw_2025/iciw_2025_1_10_20022.pdf',
          text: 'Random Forest and XGBoost over hardware performance counters sampled every 50 microseconds, with real time mitigation. Roughly 96 percent accuracy. Tested on both an idle and a fully loaded machine. One of the strongest systems of its kind, and its counters, sampling interval, tools and load protocol are all published, which makes the work reproducible.',
        },
        {
          title: 'Joshi et al.',
          meta: '2025, arXiv:2501.17123',
          ref: 2,
          href: 'https://arxiv.org/abs/2501.17123',
          text: 'Applies deep learning to the same detection task and reports high accuracy.',
        },
      ],
    },
  },
  {
    id: 'gap',
    navLabel: 'The gap',
    accent: true,
    heading: 'The gap: why detectors fail under realistic system load',
    paragraphs: [
      'Those accuracy figures are measured on quiet machines. The victim runs, the attacker runs, and very little else does. On a production host that assumption fails the moment a neighbouring tenant gets busy, and a busy tenant hammers the cache for entirely legitimate reasons.',
      'Below, an attacker’s probe loop and an ordinary video-compression service share a last-level cache. Both are watched by a detector trained the way the literature trains one: on an idle machine. Move the load slider and watch what that detector does to the tenant.',
    ],
    figure: {
      component: 'gap',
      label: 'Figure 4',
      caption:
        'At idle the tenant sits well below the attacker and the detector stays quiet. As the host fills up, the four numbers the detector actually consumes drift together until the tenant’s windows are indistinguishable from the attacker’s, and the accusations begin.',
    },
    afterFigure: [
      'A cloud provider cannot run a detector that accuses its own paying customers whenever they get busy. In the reference design a false alarm does more than raise a ticket: it triggers noise injection, which deliberately slows the accused workload down. The innocent tenant is punished for the crime of being busy.',
      'So the provider switches the detector off. The attacker is not troubled by a detector nobody runs, and the real victim is left exactly where it started, unprotected. Closing that gap is the problem this thesis takes on.',
    ],
  },
  {
    id: 'method',
    navLabel: 'Proposed method',
    heading: 'The proposed method',
    paragraphs: [
      'An attack has a rhythm. The loop in section 2 is the whole of it: flush the line, wait, time the reload, repeat, thousands of times at a near fixed cadence. What marks an attacker is not how much cache activity it produces. It is that the activity repeats on a schedule.',
      'That is exactly what the detector in section 3 throws away. Every window is collapsed into averages before the model ever sees it, so the only thing that survives the trip is how busy the cache was. A heavy but perfectly honest program is busy too, which is why it starts getting accused the moment the host fills up.',
      'The figure below makes that concrete rather than asserting it. Both windows come from the same two traces you have been watching, held at full load, which is the situation that defeated the detector in section 4.',
    ],
    figure: {
      component: 'shuffle',
      label: 'Figure 5',
      caption:
        'Shuffling the samples inside a window destroys its rhythm completely and moves not one of the summary statistics. Those statistics cannot see order, so a model built on them is blind to the single property that separates an attacker from a busy neighbour. Note also that the loaded tenant is now the busier of the two, so magnitude ranks the innocent process as the more suspicious one.',
    },
    blocks: [
      {
        type: 'prose',
        paragraphs: [
          'So the question is not which classifier to use. It is what the classifier is allowed to look at. This thesis proposes a Temporal Graph Network, and the reason is structural rather than a bet that a larger model wins.',
          'The obvious objection comes first. Counter data is a time series, not a graph, so what exactly is being graphed? The nodes are the hardware counters themselves, all fourteen of them. The edges are the relationships between those counters: which ones move together inside a window, and how strongly. Those edges are recomputed as the window advances, and that is what makes the graph temporal. The model learns how the coupling between counters changes from one window to the next, rather than only what each counter reads.',
          'The argument for why this fits the problem follows from what an attack is. A probe loop is a repeating hardware operation, so it should drive a recurring and structured coupling between specific counters. Cache references, cache misses and last level cache misses lock into a stable relationship, and that relationship comes back on the loop\u2019s period. A heavy but honest workload drives many counters hard at once and settles into no such structure. The attacker is then identified by a relational pattern over time rather than by magnitude, which is precisely the property the summary statistics destroyed.',
          'That is the contribution, and it is worth being exact about it. The claim is about where the signal lives in this data, not that a bigger model classifies better.',
        ],
      },
      {
        type: 'figure',
        component: 'graph',
        wide: true,
        label: 'Figure 6',
        caption:
          'The fourteen counters as nodes, with an edge drawn wherever two of them move together inside the current window. On the attacker the same clusters lock together again and again on the period of the probe loop, and the strip beneath shows that repetition directly. On the loaded tenant the coupling is denser, and it is different every window, and it never returns.',
      },
      {
        type: 'prose',
        paragraphs: [
          'The comparison is three way, so that the contribution is measured against the best existing work rather than against a straw baseline.',
        ],
      },
      {
        type: 'figure',
        component: 'paths',
        wide: true,
        label: 'Figure 7',
        caption:
          'The same window handled three ways. The classical baseline collapses it into features. The deep baseline reads it as a sequence, keeping time but treating the counters apart. The proposed model reads it as a graph that changes shape from window to window, keeping both the order and the relationships.',
      },
      {
        type: 'prose',
        paragraphs: [
          'The prediction is straightforward. If relational rhythm is the real signal, a model able to see it should raise far fewer false alarms under load while still catching the attack at the rate the baselines manage.',
          'It may not. If the Temporal Graph Network does no better than the collapsed baseline or the deep sequence baseline, then this structure is not present in these counters at this sampling interval, and the limitation lies in the counters rather than in the model. That would be a genuinely useful finding, and this study is built to report it rather than to avoid it.',
        ],
      },
      {
        type: 'spec',
        title: 'Study design',
        items: [
          {
            term: 'Setup',
            detail:
              'Fourteen hardware performance counters collected through perf on a Dell OptiPlex on bare metal, sampled every 50 microseconds, following the feature set of Ghabbara and Trifa 2025 [[1]].',
          },
          {
            term: 'Data',
            detail:
              'Mastik implementations of Flush+Reload, Prime+Probe and Flush+Flush as attacks. MiBench and ordinary desktop workloads as benign traffic. Each recorded idle and under full load, across repeated runs.',
          },
          {
            term: 'Models',
            detail:
              'Three way. The classical baseline of Random Forest and XGBoost over summary statistics, reproduced from Ghabbara and Trifa 2025 [[1]]. The hybrid deep model of Joshi et al. 2025 [[2]], reproduced on this data as the closest existing deep learning approach to the task. The proposed Temporal Graph Network.',
          },
          {
            term: 'Metrics',
            detail:
              'False alarm rate first, then detection rate and F1, plus per window inference time to confirm the model is still fast enough for real time use.',
          },
        ],
      },
      {
        type: 'ranked',
        title: 'The fourteen counters, in published ranking order',
        note: 'The ranking is from the base paper [[1]] and reports which signals carry the most information for this task, strongest first. These same fourteen counters are the nodes of the graph in figure 6.',
        items: [
          'cache-references',
          'cache-misses',
          'CPU-cycles',
          'instructions',
          'branches',
          'branch-misses',
          'L1-dcache-load-misses',
          'L1-icache-load-misses',
          'LLC-misses',
          'iTLB-load-misses',
          'LLC-store-misses',
          'LLC-loads',
          'dTLB-load-misses',
          'branch-instructions',
        ],
      },
      {
        type: 'prose',
        paragraphs: [
          'Two things make this testbed able to support the claim. The first is that every alarm can be checked. The researcher controls which process is the attacker, so a false alarm is counted exactly rather than estimated.',
          'The second is that the baseline is fully documented. The base paper [[1]] publishes its counters, its sampling interval, its tools and its load protocol, so the comparison holds the setup fixed and any improvement can be credited to the model rather than to a different machine.',
        ],
      },
      {
        type: 'sources',
        title: 'The strongest objection',
        entries: [
          {
            title: 'Kosasih et al.',
            meta: 'AsiaCCS 2024',
            ref: 4,
            href: 'https://dl.acm.org/doi/10.1145/3634737.3637649',
            text: 'Questions whether hardware performance counters can detect these attacks reliably at all. This is the most serious challenge to the entire line of work, and it is the reason false alarm rate under load is the headline metric here rather than accuracy. If counter based detection cannot be made to hold up under load, this study is designed to say so plainly.',
          },
        ],
      },
    ],
  },
  /*
   * DISABLED: "Where mitigation goes from here".
   * Kept in the codebase so it can be restored. While this stays commented out
   * it does not render and does not appear in the navigation, because both are
   * derived from this array. Section numbering and figure numbering come from
   * the array index, so uncommenting is all that is needed to bring it back.
   *
   *   {
   *     id: 'mitigation',
   *     navLabel: 'What follows',
   *     heading: 'Where mitigation goes from here',
   *     paragraphs: [
   *       'Placeholder. What a detector is actually for: it is an input to a scheduler or a migration decision, not an end in itself.',
   *       'Placeholder. Scope and honest limits: what this thesis will not attempt, and which questions it leaves open.',
   *     ],
   *     figure: {
   *       label: 'Figure 7',
   *       hint: 'Detection signal to response: the decision path after an alert.',
   *       caption:
   *         'Caption placeholder. State the assumed response latency budget.',
   *     },
   *   },
   */

  {
    id: 'references',
    navLabel: 'References',
    heading: 'References',
    references: [
      {
        number: 1,
        citation:
          'Y. Ghabbara and Z. Trifa, "A real-time cache side channel attack detection and mitigation framework based on machine learning," in Proc. 20th Int. Conf. Internet and Web Applications and Services (ICIW), IARIA, 2025.',
        href: 'https://personales.upv.es/thinkmind/dl/conferences/iciw/iciw_2025/iciw_2025_1_10_20022.pdf',
        role: 'The base paper. This work reproduces its counter set, its sampling interval and its load protocol.',
      },
      {
        number: 2,
        citation:
          'Joshi et al., "Hybrid deep learning model for multiple cache side channel attacks detection: A comparative analysis," arXiv preprint arXiv:2501.17123, 2025.',
        href: 'https://arxiv.org/abs/2501.17123',
        role: 'The deep learning baseline, reproduced here for comparison.',
      },
      {
        number: 3,
        citation:
          'Tong et al., "Cache side-channel attacks detection for AES encryption based on machine learning," in Proc. Int. Conf. Intelligent Computing (ICIC), Lecture Notes in Computer Science, vol. 14875, Springer, 2024.',
        href: null,
        role: 'Earlier precedent for treating detection as supervised classification over counter data, scoped to attacks on AES rather than to a general workload.',
      },
      {
        number: 4,
        citation:
          'D. Kosasih, F. Feng, C. Chuengsatiansup, Y. Yarom, and Z. Zhu, "Can we really detect cache side-channel attacks by monitoring performance counters?," in Proc. ACM Asia Conf. Computer and Communications Security (AsiaCCS), 2024.',
        href: 'https://dl.acm.org/doi/10.1145/3634737.3637649',
        role: 'Challenges the premise of counter based detection. Cited in the proposed method section.',
      },
    ],
    tools: {
      title: 'Tools and datasets',
      items: [
        {
          name: 'Mastik',
          href: 'https://github.com/0xADE1A1DE/Mastik',
          detail: 'Micro-architectural side-channel toolkit. Source of the attack implementations.',
        },
        {
          name: 'MiBench',
          href: 'https://vhosts.eecs.umich.edu/mibench/',
          detail: 'Embedded benchmark suite. Used as benign workload traffic.',
        },
        {
          name: 'perf',
          href: 'https://perfwiki.github.io/main/',
          detail: 'Linux profiling tool. Used to collect the hardware counters.',
        },
      ],
    },
  },
]
