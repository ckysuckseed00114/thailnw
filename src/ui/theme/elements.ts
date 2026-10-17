import type {Element} from '../../core/Skills';
/** Colour per skill element, shared by the hotbar and in-world damage numbers. */
export const ELEMENT_COLOR:Record<Element,{fill:string;stroke:string}>={
 holy:{fill:'#ffd77a',stroke:'#4a2c08'},lightning:{fill:'#9fdcff',stroke:'#0c2c4a'},arcane:{fill:'#d2b2ff',stroke:'#2c1450'},
 earth:{fill:'#eeb070',stroke:'#4a2410'},shadow:{fill:'#c3a2ff',stroke:'#1e1030'},nature:{fill:'#86f09a',stroke:'#0d3315'},spirit:{fill:'#7fd8ff',stroke:'#0b2a40'},
};
