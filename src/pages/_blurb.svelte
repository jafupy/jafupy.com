<script>
  import { T, TCollapsed, TOpen, TTrigger } from "$/lib/telescope";
    import TCollapse from "$/lib/telescope/t-collapse.svelte";

    function getDateDelta(fromDate, toDate = new Date()) {
      let years = toDate.getFullYear() - fromDate.getFullYear();
      let months = toDate.getMonth() - fromDate.getMonth();
      let days = toDate.getDate() - fromDate.getDate();
      let hours = toDate.getHours() - fromDate.getHours();
      let minutes = toDate.getMinutes() - fromDate.getMinutes();
      let seconds = toDate.getSeconds() - fromDate.getSeconds();

      if (seconds < 0) {
        seconds += 60;
        minutes--;
      }

      if (minutes < 0) {
        minutes += 60;
        hours--;
      }

      if (hours < 0) {
        hours += 24;
        days--;
      }

      if (days < 0) {
        const previousMonth = new Date(
          toDate.getFullYear(),
          toDate.getMonth(),
          0
        );

        days += previousMonth.getDate();
        months--;
      }

      if (months < 0) {
        months += 12;
        years--;
      }

      return {
        years,
        months,
        days,
        hours,
        minutes,
        seconds,
      };
    }

    const start = new Date(2010, 0, 12, 23, 0, 0);
    // Months are zero-based: 0 = Jan, 4 = May, etc.

    const age = getDateDelta(start)
</script>

<T>
  <TCollapsed>
    I'm <TTrigger>Jacob</TTrigger>,
  </TCollapsed>
  <TOpen>
    My name is Jacob, but online people call be <T>
      <TCollapsed><TTrigger>Jafu</TTrigger>.</TCollapsed>
      <TOpen>Jafu, or sometimes just jaf.</TOpen>
    </T>
  </TOpen>
</T>
<T>
  <TCollapsed><TTrigger>{age.years}</TTrigger></TCollapsed>
  <TOpen>I'm <T><TOpen><TTrigger>{age.years}</TTrigger> years old</TOpen><TCollapsed>{age.years}, {age.months} months and {age.days} days old to be exact</TCollapsed></T>, born Jan 12 2010.</TOpen>
</T>
I live in
<T>
  <TCollapsed><TTrigger>southern England</TTrigger></TCollapsed>
  <TOpen>southern England, but I'm polish.</TOpen>
</T>
<T>
  <TCollapsed>I do <TTrigger>stuff</TTrigger>.</TCollapsed>
  <TOpen>I go to <T><TCollapsed><TTrigger>school</TTrigger>,</TCollapsed><TOpen>secondary school, where I'm in year 11. I also</TOpen></T> play [[guitar]] and write code</TOpen>
</T>
