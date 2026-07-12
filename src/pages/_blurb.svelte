<script lang="ts">
  import { onMount } from "svelte";
  import { T, TCollapsed, TOpen, TTrigger } from "$/lib/telescope";
  import { getDateDelta } from "$/lib/date";

  const birthday = new Date(2010, 0, 12, 23, 0, 0);
  let age = $state(getDateDelta(birthday));

  onMount(() => {
    let timeout: ReturnType<typeof setTimeout>;

    function scheduleUpdate() {
      const now = new Date();
      const nextUpdate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
      );

      if (nextUpdate <= now) nextUpdate.setDate(nextUpdate.getDate() + 1);

      timeout = setTimeout(() => {
        age = getDateDelta(birthday);
        scheduleUpdate();
      }, nextUpdate.getTime() - now.getTime());
    }

    scheduleUpdate();

    return () => clearTimeout(timeout);
  });
</script>

<T>
  <TCollapsed>
    I'm <TTrigger>Jacob</TTrigger>,
  </TCollapsed>
  <TOpen>
    My name is Jacob, but online people call me <T>
      <TCollapsed><TTrigger>Jafu</TTrigger>.</TCollapsed>
      <TOpen>Jafu, or sometimes just jaf.</TOpen>
    </T>
  </TOpen>
</T>
<T>
  <TCollapsed><TTrigger>{age.years}</TTrigger>,</TCollapsed>
  <TOpen>I'm <T><TCollapsed><TTrigger>{age.years}</TTrigger> years old</TCollapsed><TOpen>{age.years} years, {age.months} months and {age.days} days old to be exact</TOpen></T>, born Jan 12, 2010.</TOpen>
</T>
I live in
<T>
  <TCollapsed><TTrigger>southern England</TTrigger>.</TCollapsed>
  <TOpen>southern England, but I'm Polish.</TOpen>
</T>
<T>
  <TCollapsed>I do <TTrigger>stuff</TTrigger>.</TCollapsed>
  <TOpen>I go to <T>
    <TCollapsed><TTrigger>school</TTrigger>,</TCollapsed>
    <TOpen>secondary school, where I'm in year 11. I also</TOpen></T>
    play <T>
      <TCollapsed><TTrigger>guitar</TTrigger></TCollapsed>
      <TOpen>classical-ish / fingerstyle / "percussive" guitar</TOpen>
    </T> and write <T>
      <TCollapsed><TTrigger>code</TTrigger></TCollapsed>
      <TOpen>code. Mostly JS and Rust</TOpen>
    </T>.</TOpen>
</T>
