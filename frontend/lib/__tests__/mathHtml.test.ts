import { buildHtml } from '../utils/mathHtml';
import { filterTopicsByProfile, type StudentProfile } from '../utils/studentProfile';

describe('MathContent HTML & GFM Table rendering', () => {
  it('renders GFM markdown table directly below a numbered heading cleanly without raw pipes', () => {
    const markdown = [
      '5. Food Tests',
      '| Food substance | Test | Positive result |',
      '|---|---|---|',
      '| Starch | Add iodine solution | Blue-black colour |',
      '| Protein | Biuret test | Purple colour |',
      '',
      '6. Food Preservation',
      'Food preservation prevents or delays spoilage.',
    ].join('\n');

    const html = buildHtml(markdown, undefined, true);

    expect(html).toContain('>5. Food Tests</h4>');
    expect(html).toContain('>6. Food Preservation</h4>');
    expect(html).toContain('<table');
    expect(html).toContain('<thead');
    expect(html).toContain('<th');
    expect(html).toContain('Food substance');
    expect(html).toContain('Blue-black colour');
    expect(html).not.toContain('|---|---|---|');
    expect(html).not.toContain('| Starch |');
  });

  it('renders bold-wrapped numbered headings and tables cleanly', () => {
    const markdown = [
      '**5. Food Tests**',
      '| Food substance | Test |',
      '| :--- | ---: |',
      '| Fat | Ethanol emulsion test |',
    ].join('\n');

    const html = buildHtml(markdown, undefined, true);

    expect(html).toContain('>5. Food Tests</h4>');
    expect(html).toContain('text-right');
    expect(html).toContain('Ethanol emulsion test');
    expect(html).not.toContain('| :--- |');
  });

  it('renders multi-item numbered lists as <ol>', () => {
    const markdown = ['1. First step', '2. Second step', '3. Third step'].join('\n');
    const html = buildHtml(markdown, undefined, true);

    expect(html).toContain('<ol');
    expect(html).toContain('1.');
    expect(html).toContain('2.');
    expect(html).toContain('3.');
  });
});

describe('Review badge / profile topic filtering consistency', () => {
  it('excludes due items outside the student selected subjects so badge matches Review page', () => {
    const queue = [
      { topic_id: '1', subject: 'Physics' },
      { topic_id: '2', subject: 'Geography' },
      { topic_id: '3', subject: 'Government' },
      { topic_id: '4', subject: 'Literature in English' },
      { topic_id: '5', subject: 'Agricultural Science' },
      { topic_id: '6', subject: 'Commerce' },
    ];
    const profile: StudentProfile = {
      name: 'Ada',
      class_level: 'SS3',
      targets: ['WAEC'],
      selectedSubjects: ['Mathematics', 'English Language', 'Chemistry'],
      completedOnboarding: true,
    };

    expect(filterTopicsByProfile(queue, profile)).toHaveLength(0);
  });
});
