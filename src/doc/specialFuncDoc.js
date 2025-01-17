/* 
 * This file is part of OverPy (https://github.com/Zezombye/overpy).
 * Copyright (c) 2019 Zezombye.
 * 
 * This program is free software: you can redistribute it and/or modify  
 * it under the terms of the GNU General Public License as published by  
 * the Free Software Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful, but 
 * WITHOUT ANY WARRANTY; without even the implied warranty of 
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU 
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License 
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

//This file is only used for the vs code extension.

const specialFuncs = [
    //Special functions and built-in macros
    {
        opy: "chase",
        "description": "Gradually modifies the value of a variable (global or player) at a specific rate, or over time.",
        "args": [
            {
                "name": "VARIABLE",
                "description": "Specifies which variable (global or player) to modify gradually.",
                "type": "VARIABLE",
                "default": "A"
            },
            {
                "name": "DESTINATION",
                "description": "The value that the variable will eventually reach. The type of this value may be either a number or a vector, though the variable's existing value must be of the same type before the chase begins.",
                "type": "ANY",
                "default": "NUMBER"
            },
            {
                "name": "RATE OR DURATION",
                "description": "The amount of change that will happen to the variable's value each second, or the amount of time, in seconds, over which the variable's value will approach the destination.\n\nPut `rate=xxxx` or `duration=xxxx` as argument.",
                "type": "NUMBER",
                "default": "NUMBER"
            },
            {
                "name": "REEVALUATION",
                "description": "Specifies which of this action's inputs will be continuously reevaluated. This action will keep asking for and using new values from reevaluated inputs.",
                "type": "CHASE RATE REEVALUATION",
                "default": "DESTINATION AND RATE"
            }
        ],
    },{
        opy: "stopChasingVariable",
        "description": "Stops an in-progress chase of a variable (global or player), leaving it at its current value.",
        "args": [
            {
                "name": "VARIABLE",
                "description": "Specifies which variable (global or player) to stop modifying.",
                "type": "VARIABLE",
                "default": "A"
            }
        ]
    },{
        opy: "wait",
        "description": "Pauses the execution of the action list. Unless the wait is interrupted, the remainder of the actions will execute after the pause.",
        "args": [
            {
                "name": "TIME",
                "description": "The duration of the pause.",
                "type": "NUMBER",
                "default": "NUMBER"
            },
            {
                "name": "WAIT BEHAVIOR",
                "description": "Specifies if and how the wait can be interrupted. If the condition list is ignored, the wait will not be interrupted. Otherwise, the condition list will determine if and when the action list will abort or restart. If omitted, defaults to `Wait.IGNORE_CONDITION`.",
                "type": "WAIT BEHAVIOR",
                "default": "IGNORE CONDITION"
            }
        ]
    },{
        opy: "raycast",
        description: 
`Defines a raycast to be then used with \`hasLoS()\`, \`getPlayerHit()\`, \`getNormal()\` or \`getHitPosition()\`.
For line of sight, the 3rd argument must be \`los=\` and the 4th and 5th arguments must be omitted.

Examples:
- \`raycast(A, B, include=C, exclude=D, includePlayerObjects=false).getHitPosition()\`
- \`raycast(A, B, los=BarrierLos.BLOCKED_BY_ALL_BARRIERS).hasLoS()\``,
        args: [
            {
                "name": "START POS",
                "description": "The start position for the ray cast. If a player is provided, a position 2 meters above the player's feet is used.",
                "type": "POSITION",
                "default": "VECTOR"
            },
            {
                "name": "END POS",
                "description": "The end position for the ray cast. If a player is provided, a position 2 meters above the player's feet is used.",
                "type": "POSITION",
                "default": "VECTOR"
            },
            {
                "name": "include=players To Include",
                "description": "Which players can be hit by this ray cast. Note: if doing a line-of-sight check, use `los=BarrierLos.xxxx` instead.",
                "type": "PLAYER",
                "default": "ALL PLAYERS"
            },
            {
                "name": "exclude=players To Exclude",
                "description": "Which players cannot be hit by this ray cast. This list takes precedence over players to include.",
                "type": "PLAYER",
                "default": "EVENT PLAYER"
            },
            {
                "name": "include Player Objects=bool",
                "description": "Whether player-owned objects (such as barriers or turrets) should be included in the ray cast.",
                "type": "BOOLEAN",
                "default": "TRUE"
            }
        ]
    },{
        opy: "all",
        "description": "Whether the specified condition evaluates to true for every value in the specified iterable. Requires a condition.\n\nExample: `all(player for player in getAllPlayers() if player.A == 2)`",
        "args": [
            {
                "name": "iterable",
                "description": "The iterable whose values will be considered.",
                "type": "ITERABLE",
                "default": "GLOBAL VARIABLE"
            },
        ]
    },{
        opy: "any",
        "description": "Whether the specified condition evaluates to true for any value in the specified iterable. Requires a condition.\n\nExample: `any(player for player in getAllPlayers() if player.A == 2)`",
        "args": [
            {
                "name": "iterable",
                "description": "The iterable whose values will be considered.",
                "type": "ITERABLE",
                "default": "GLOBAL VARIABLE"
            },
        ]
    },{
        opy: "floor",
        "description": "The integer that is the floor of the specified value (equivalent to rounding down).",
        "args": [
            {
                "name": "VALUE",
                "description": "The real number to get the floor of.",
                "type": "NUMBER",
                "default": "NUMBER"
            },
        ],
    },{
        opy: "round",
        "description": "The integer that is closest to the specified value (equivalent to rounding to nearest).\n\nTo round up or down, use `ceil()` or `floor()`.",
        "args": [
            {
                "name": "VALUE",
                "description": "The real number to get the nearest integer of.",
                "type": "NUMBER",
                "default": "NUMBER"
            },
        ],
    },{
        opy: "ceil",
        "description": "The integer that is the ceiling of the specified value (equivalent to rounding up).",
        "args": [
            {
                "name": "VALUE",
                "description": "The real number to get the ceiling of.",
                "type": "NUMBER",
                "default": "NUMBER"
            },
        ],
    },{
        opy: "sorted",
        "description": "A copy of the specified array with the values sorted according to the lambda function that is evaluated for each element.\n\nExample: `sorted(getAllPlayers(), key=lambda x: x.getScore())`",
        "args": [
            {
                "name": "ARRAY",
                "description": "The array whose copy will be sorted.",
                "type": "ANY",
                "default": "GLOBAL VARIABLE"
            },
            {
                "name": "key=lambda",
                "description": "The lambda function that is evaluated for each element of the copied array. The array is sorted by this rank in ascending order. Can be omitted if the array is sorted without a special key (equivalent to `lambda x: x`).",
                "type": "LAMBDA",
                "default": "CURRENT ARRAY ELEMENT"
            }
        ]
    },{
        opy: "getAllPlayers",
        description: "Built-in macro for `getPlayers(Team.ALL)`.",
        args: [],
    },{
        opy: "hudText",
        "description": "Creates hud text visible to specific players at a specific location on the screen. This text will persist until destroyed. To obtain a reference to this text, use the last text id value. This action will fail if too many text elements have been created.\n\nNote: you can use the macros `hudHeader`, `hudSubheader` and `hudSubtext` to reduce the number of arguments.",
        "args": [
            {
                "name": "VISIBLE TO",
                "description": "One or more players who will see the hud text.",
                "type": "PLAYER",
                "default": "ALL PLAYERS"
            },
            {
                "name": "HEADER",
                "description": "The text to be displayed (can be blank)",
                "type": "ANY",
                "default": "STRING"
            },
            {
                "name": "SUBHEADER",
                "description": "The subheader text to be displayed (can be blank)",
                "type": "ANY",
                "default": "NULL"
            },
            {
                "name": "TEXT",
                "description": "The body text to be displayed (can be blank)",
                "type": "ANY",
                "default": "NULL"
            },
            {
                "name": "LOCATION",
                "description": "The location on the screen where the text will appear.",
                "type": "HUD LOCATION",
                "default": "LEFT"
            },
            {
                "name": "SORT ORDER",
                "description": "The sort order of the text relative to other text in the same location. A higher sort order will come after a lower sort order.",
                "type": "NUMBER",
                "default": "NUMBER"
            },
            {
                "name": "HEADER COLOR",
                "description": "The color of the header.",
                "type": "COLOR",
                "default": "WHITE"
            },
            {
                "name": "SUBHEADER COLOR",
                "description": "The color of the subheader.",
                "type": "COLOR",
                "default": "WHITE"
            },
            {
                "name": "TEXT COLOR",
                "description": "The color of the text.",
                "type": "COLOR",
                "default": "WHITE"
            },
            {
                "name": "REEVALUATION",
                "description": "Specifies which of this action's inputs will be continuously reevaluated.",
                "type": "HUD TEXT REEVALUATION",
                "default": "VISIBLE TO AND STRING"
            },
            {
                "name": "SPECTATORS",
                "description": "Whether spectators can see the text or not. Optional argument.",
                "type": "SPECTATOR VISIBILITY",
                "default": "DEFAULT VISIBILITY"
            }
        ],
    },{
        opy: "hudHeader",
        description: "Built-in macro for `hudText` to reduce the number of arguments.",
        args: [
            {
                "name": "VISIBLE TO",
                "description": "One or more players who will see the hud text.",
                "type": "PLAYER",
                "default": "ALL PLAYERS"
            },
            {
                "name": "HEADER",
                "description": "The text to be displayed (can be blank)",
                "type": "ANY",
                "default": "STRING"
            },
            {
                "name": "LOCATION",
                "description": "The location on the screen where the text will appear.",
                "type": "HUD LOCATION",
                "default": "LEFT"
            },
            {
                "name": "SORT ORDER",
                "description": "The sort order of the text relative to other text in the same location. A higher sort order will come after a lower sort order.",
                "type": "NUMBER",
                "default": "NUMBER"
            },
            {
                "name": "HEADER COLOR",
                "description": "The color of the header.",
                "type": "COLOR",
                "default": "WHITE"
            },
            {
                "name": "REEVALUATION",
                "description": "Specifies which of this action's inputs will be continuously reevaluated.",
                "type": "HUD TEXT REEVALUATION",
                "default": "VISIBLE TO AND STRING"
            },
            {
                "name": "SPECTATORS",
                "description": "Whether spectators can see the text or not. Optional argument.",
                "type": "SPECTATOR VISIBILITY",
                "default": "DEFAULT VISIBILITY"
            }
        ],
    },{
        opy: "hudSubtext",
        description: "Built-in macro for `hudText` to reduce the number of arguments.",
        args: [
            {
                "name": "VISIBLE TO",
                "description": "One or more players who will see the hud text.",
                "type": "PLAYER",
                "default": "ALL PLAYERS"
            },
            {
                "name": "SUBTEXT",
                "description": "The body text to be displayed (can be blank)",
                "type": "ANY",
                "default": "NULL"
            },
            {
                "name": "LOCATION",
                "description": "The location on the screen where the text will appear.",
                "type": "HUD LOCATION",
                "default": "LEFT"
            },
            {
                "name": "SORT ORDER",
                "description": "The sort order of the text relative to other text in the same location. A higher sort order will come after a lower sort order.",
                "type": "NUMBER",
                "default": "NUMBER"
            },
            {
                "name": "TEXT COLOR",
                "description": "The color of the text.",
                "type": "COLOR",
                "default": "WHITE"
            },
            {
                "name": "REEVALUATION",
                "description": "Specifies which of this action's inputs will be continuously reevaluated.",
                "type": "HUD TEXT REEVALUATION",
                "default": "VISIBLE TO AND STRING"
            },
            {
                "name": "SPECTATORS",
                "description": "Whether spectators can see the text or not. Optional argument.",
                "type": "SPECTATOR VISIBILITY",
                "default": "DEFAULT VISIBILITY"
            }
        ],
    },{
        opy: "hudSubheader",
        description: "Built-in macro for `hudText` to reduce the number of arguments.",
        args: [
            {
                "name": "VISIBLE TO",
                "description": "One or more players who will see the hud text.",
                "type": "PLAYER",
                "default": "ALL PLAYERS"
            },
            {
                "name": "SUBHEADER",
                "description": "The subheader text to be displayed (can be blank)",
                "type": "ANY",
                "default": "NULL"
            },
            {
                "name": "LOCATION",
                "description": "The location on the screen where the text will appear.",
                "type": "HUD LOCATION",
                "default": "LEFT"
            },
            {
                "name": "SORT ORDER",
                "description": "The sort order of the text relative to other text in the same location. A higher sort order will come after a lower sort order.",
                "type": "NUMBER",
                "default": "NUMBER"
            },
            {
                "name": "SUBHEADER COLOR",
                "description": "The color of the subheader.",
                "type": "COLOR",
                "default": "WHITE"
            },
            {
                "name": "REEVALUATION",
                "description": "Specifies which of this action's inputs will be continuously reevaluated.",
                "type": "HUD TEXT REEVALUATION",
                "default": "VISIBLE TO AND STRING"
            },
            {
                "name": "SPECTATORS",
                "description": "Whether spectators can see the text or not. Optional argument.",
                "type": "SPECTATOR VISIBILITY",
                "default": "DEFAULT VISIBILITY"
            }
        ],
    },{
        opy: "RULE_CONDITION",
        "description": 
`Equivalent to true if every condition in the rule is true. Can only be used in the following cases:

- \`while RULE_CONDITION\`
- \`while not RULE_CONDITION\`
- \`if RULE_CONDITION: continue\`
- \`if not RULE_CONDITION: continue\`
- \`if RULE_CONDITION: abort\`
- \`if not RULE_CONDITION: abort\``,
        "args": null
    }
];

const specialMemberFuncs = [
    
    {
        opy: "append",
        "description": "Appends the specified value to the specified array. Note that this function is really the equivalent of `extend()`, that is, `[1,2].append([3,4])` will produce `[1,2,3,4]` instead of `[1,2,[3,4]]`. If used without an assignment, modifies the array in-place.\n\nExample: `A.append(3)`",
        "args": [
            {
                "name": "VALUE",
                "description": "The value to append to the end of the array. If this value is itself an array, each element is appended.",
                "type": "ANY",
                "default": "NUMBER"
            }
        ]
    },{
        opy: "slice",
        "description": "A copy of the specified array containing only values from a specified index range.",
        "args": [
            {
                "name": "START INDEX",
                "description": "The first index of the range.",
                "type": "NUMBER",
                "default": "NUMBER"
            },
            {
                "name": "COUNT",
                "description": "The number of elements in the resulting array. The resulting array will contain fewer elements if the specified range exceeds the bounds of the array.",
                "type": "NUMBER",
                "default": "NUMBER"
            }
        ]
    },{
        opy: "index",
        "description": "The index of a value within an array or -1 if no such value can be found.",
        "args": [
            {
                "name": "VALUE",
                "description": "The value for which to search.",
                "type": "NUMBER",
                "default": "NUMBER"
            }
        ]
    },{
        opy: "hasLoS",
        description: "Whether the start and end position of a raycast have line of sight with each other.",
        args: [],
    },{
        opy: "getNormal",
        description: "The surface normal at the raycast hit position (or from end pos to start pos if no hit occurs).",
        args: [],
    },{
        opy: "getPlayerHit",
        description: "The player hit by the raycast (or null if no player is hit).",
        args: [],
    },{
        opy: "getHitPosition",
        description: "The position where the raycast hits a surface, object, or player (or the end pos if no hit occurs).",
        args: [],
    }
];
