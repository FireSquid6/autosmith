

A skill is a directory that contains a `SKILL.md` file:


```
my-skill/
    SKILL.md
    scripts/
        ... executable scripts, optional
    reference/
        ... more documentation, optional
    assets/
        ... assets, optional
```


Importantly, each skill has some important frontmatter:

```md
---
title: My Skill
description: This is an example skill
---

... skill text here


```


All skills are stored in a central skills directory at the root of the fleet directory. Each agent has an optional `skills` property in their `agent.yaml` file that enumerates all skills that should be given to the AI. The title and description of all manifested skills should be injected to the AI's system prompt.

Agents also need to have a toolkit for injecting the `SKILL.md` into their context as well as being able to read inside of a skill's filesystem.

