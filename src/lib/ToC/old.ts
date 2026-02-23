// import {
//   Dialog,
//   DialogContent,
//   DialogOverlay,
//   DialogTitle,
// } from "@radix-ui/react-dialog";
// import { useEffect, useRef, useState } from "react";
// import useHighestHeading from "$/lib/hooks/useHighestHeading";

// import {
//   Heading1Icon,
//   Heading2Icon,
//   Heading3Icon,
//   Heading4Icon,
//   Heading5Icon,
//   Heading6Icon,
// } from "lucide-react";

// import { AnimatePresence, motion } from "motion/react";
// import { cn } from "$/lib";

// export default function TableOfContents({
//   headings,
// }: {
//   headings: {
//     depth: number;
//     slug: string;
//     text: string;
//   }[];
// }) {
//   const ToC = useRef(null);
//   const WhiteLine = useRef(null);
//   const [hovered, setHovered] = useState(false);

//   const highestHeading = useHighestHeading();

//   useEffect(() => {
//     if (!WhiteLine.current) return;
//     //@ts-expect-error
//     WhiteLine.current.scrollIntoView({
//       behavior: "smooth",
//       block: "center",
//     });
//   }, [highestHeading]);

//   if (headings.length <= 2) return;
//   return (
//     <AnimatePresence>
//       <div
//         onMouseOver={() => setHovered(true)}
//         onMouseLeave={() => setHovered(false)}
//         ref={ToC}
//         className="fixed right-4 inset-y-1/5 min-w-16"
//         style={{
//           scrollbarWidth: "none",
//         }}
//       >
//         {hovered ? (
//           <motion.div
//             key="abse"
//             className="h-full text-left absolute inset-y-0 right-0 w-fit overflow-visible"
//             animate={{
//               opacity: 1,
//               translateX: 0,
//             }}
//             initial={{
//               opacity: 0,
//               translateX: 100,
//             }}
//             exit={{ opacity: 0, translateX: 100 }}
//             // transition={{
//             //   duration: 0.2,
//             // }}
//           >
//             <div
//               data-hovered={hovered}
//               style={{ scrollbarWidth: "none" }}
//               className="bg-grey-50/20 dark:bg-grey-950/20 h-full backdrop-blur-md border  border-grey-900/20 dark:border-grey-100/20 rounded-xl p-2 overflow-scroll flex flex-col gap-2 not-data-[hovered]:scale-x-0 transition-all"
//             >
//               {headings.map((h, index) => {
//                 const hx = document.querySelector(
//                   `h${h.depth}#${h.slug.replace(/(^[0-9])/, "\\3$1 ")}`,
//                 );

//                 const Icon = [
//                   Heading1Icon,
//                   Heading2Icon,
//                   Heading3Icon,
//                   Heading4Icon,
//                   Heading5Icon,
//                   Heading6Icon,
//                 ][h.depth - 1];

//                 return (
//                   <button
//                     ref={h.slug === highestHeading?.id ? WhiteLine : undefined}
//                     key={JSON.stringify({ h, index })}
//                     onClick={() => {
//                       hx?.scrollIntoView({
//                         behavior: "smooth",
//                         block: "center",
//                       });
//                     }}
//                     className={cn(
//                       "flex items-center justify-center text-wrap text-left w-60 text-sm hover:text-grey-900 dark:hover:text-grey-100 hover:bg-grey-500/10 rounded-sm p-2",
//                       h.slug === highestHeading?.id &&
//                         "dark:text-blue-300 text-blue-400 hover:text-blue-300 dark:hover:text-blue-100",
//                     )}
//                   >
//                     {h.text}
//                     <Icon className="size-4 ml-auto" />
//                   </button>
//                 );
//               })}
//             </div>
//           </motion.div>
//         ) : (
//           <div
//             data-lines="lines"
//             className="flex flex-col gap-2 items-end h-full min-w-full overflow-y-hidden"
//           >
//             {headings.map((h, i) => {
//               const widths = ["w-5", "w-4", "w-3", "w-2"];

//               return (
//                 <div
//                   ref={highestHeading?.id === h.slug ? WhiteLine : undefined}
//                   key={JSON.stringify(h)}
//                   data-highest={highestHeading?.id === h.slug}
//                   className={
//                     "py-1 group flex flex-nowrap items-center gap-1 relative w-5 justify-end text-nowrap"
//                   }
//                 >
//                   <div
//                     className={cn(
//                       "h-0.5 dark:bg-grey-700 bg-grey-300 rounded-sm transition-colors",
//                       widths[
//                         h.slug === highestHeading?.id ? h.depth - 1 : h.depth
//                       ],
//                       highestHeading?.id === h.slug
//                         ? "bg-black dark:bg-white not-dark:shadow-md"
//                         : "",
//                     )}
//                   ></div>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </div>
//     </AnimatePresence>
//   );
// }
