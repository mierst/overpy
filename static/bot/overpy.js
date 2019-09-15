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

"use strict";

var currentLineNb = 0;
var currentColNb = 0;

//Global variable used for "skip ifs", to keep track of where the skip if ends.
//Is reset at each rule. (for decompilation)
var decompilerGotos = []

//Global variable used for the number of tabs.
//Is reset at each rule. (for decompilation)
var nbTabs = 0;

//Global variable used to mark the action number of the last loop in the rule.
//Is reset at each rule. (for decompilation)
var lastLoop = -1;

//Global variable used to keep track of each name for the current array element.
//Should be the empty array at the beginning and end of each rule; if not, throws an error. (for compilation and decompilation)
var currentArrayElementNames = [];

//Dictionary used for for loops.
//Should be empty at the beginning and end of each rule. (for compilation)
var forLoopVariables = {};

//Timer for for loop variables; when it is reached, delete the corresponding variable.
var forLoopTimers = [];

//Global variable used to keep track of operator precedence.
//Is reset at each action and rule condition. (for decompilation)
var operatorPrecedenceStack = [];

//Arguments of the format() function for strings.
var formatArgs = [];

//Whether the decompilation at this time is under a normal "for" loop (for decompilation).
var isInNormalForLoop = false;

//Operator precedence, from lowest to highest.
var operatorPrecedence = {
	"or":1,
	"and":2,
	"not":3,
	"==":4,
	"!=":4,
	"<=":4,
	">=":4,
	">":4,
	"<":4,
	"+":5,
	"-":5,
	"*":6,
	"/":6,
	
	//Although in Python the modulo operator has the same precedence as * and /,
	//it must have a higher precedence because (a*b)%c is not the same as a*(b%c).
	"%":7,
	"**":8,
};

//Python operators, from lowest to highest precedence.
var pyOperators = [
	"=",
	"+=",
	"-=",
	"*=",
	"/=",
	"%=",
	"**=",
	"min=",
	"max=",
	"++",
	"--",
	"or",
	"and",
	"not",
	"in",
	"==",
	"!=",
	"<=",
	">=",
	">",
	"<",
	"-",
	"+",
	"/",
	"*",
	"%",
	"**",
];
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

"use strict";

//List of workshop "keywords" (conditions, values, actions).
//Each keyword set is an array containing arrays containing 2 arrays.
//The first array is the OverPy keywords, the second array is the Workshop keywords.
//The keywords are sorted by the english workshop keyword (with the exception of the event keywords).
//Note: each workshop keyword MUST be with no spaces!

//OverPy keywords beginning with "_" aren't actually keywords; they signal to the parser that it isn't a simple keyword replacement.
//For example, the "set global variable(var, value)" is replaced by "var = value".

//Array of languages. As of now, only English is supported. This is only used during compilation.
var languages = [
	"en",
	
	//Not supported yet!
	"fr",
	"es",
	"it",
	"ru",
	"pl",
	"de",
	"pt",
	"ja",
	"kr",
	"zh",
]

var currentLanguage = languages.indexOf("en");

var ruleKw = [
[["@Rule"], [
	"rule",
]],
[["@Event"], [
	"event",
]],
[["_conditions"], [
	"conditions",
]],
[["_actions"], [
	"actions",
]],
];

//Event keywords
var eventKw = [

[["global"], [
	"ongoing-global",
]],
[["eachPlayer"], [
	"ongoing-eachplayer",
]],
[["playerTookDamage"], [
	"playerTookDamage",
]],
[["playerDealtDamage"], [
	"playerDealtDamage",
]],
[["playerDealtFinalBlow"], [
	"playerDealtFinalBlow",
]],
[["playerDied"], [
	"playerDied",
]],
[["playerEarnedElimination"], [
	"playerEarnedElimination",
]],
//Team All
[["all"], [
	"all",
]],
//Team 1
[["1"], [
	"team1",
]],
//Team 2
[["2"], [
	"team2",
]],
//Slots
[["slot0"], [
    "slot0",
]],
[["slot1"], [
    "slot1",
]],
[["slot2"], [
    "slot2",
]],
[["slot3"], [
    "slot3",
]],
[["slot4"], [
    "slot4",
]],
[["slot5"], [
    "slot5",
]],
[["slot6"], [
    "slot6",
]],
[["slot7"], [
    "slot7",
]],
[["slot8"], [
    "slot8",
]],
[["slot9"], [
    "slot9",
]],
[["slot10"], [
    "slot10",
]],
[["slot11"], [
    "slot11",
]],

];

//Action keywords. An action is defined as a function that does not return a value.
var actionKw = [

[["return"], [
	"abort",
]],
[["_abortIf"], [
	"abortIf",
]],
[["_abortIfConditionIsFalse"], [
	"abortIfConditionIsFalse",
]],
[["_abortIfConditionIsTrue"], [
	"abortIfConditionIsTrue",
]],
[["_&allowButton"], [
	"allowButton",
]],
[["_&applyImpulse"], [
	"applyImpulse",
]],
[["bigMessage"], [
	"bigMessage",
]],
[["_chaseGlobalVariableAtRate"], [
	"chaseGlobalVariableAtRate",
]],
[["_chaseGlobalVariableOverTime"], [
	"chaseGlobalVariableOverTime",
]],
[["_chasePlayerVariableAtRate"], [
	"chasePlayerVariableAtRate",
]],
[["_chasePlayerVariableOverTime"], [
	"chasePlayerVariableOverTime",
]],
[["_&clearStatusEffect"], [
	"clearStatus",
]],
[["_&communicate"], [
	"communicate",
]],
[["createEffect"], [
	"createEffect",
]],
[["createIcon"], [
	"createIcon",
]],
[["createInWorldText"], [
	"createIn-WorldText",
]],
[["hudText"], [
	"createHudText",
]],
[["damage"], [
	"damage",
]],
[["declareTeamVictory"], [
	"declareTeamVictory",
]],
[["declarePlayerVictory"], [
	"declarePlayerVictory",
]],
[["destroyAllEffects()"], [
	"destroyAllEffects",
]],
[["destroyAllHudTexts()"], [
	"destroyAllHudText",
]],
[["destroyAllIcons()"], [
	"destroyAllIcons",
]],
[["destroyAllInWorldText()"], [
	"destroyAllIn-WorldText",
]],
[["destroyEffect"], [
	"destroyEffect",
]],
[["destroyHudText"], [
	"destroyHudText",
]],
[["destroyIcon"], [
	"destroyIcon",
]],
[["destroyInWorldText"], [
	"destroyIn-WorldText",
]],
[["disableAnnouncer()"], [
	"disableBuilt-inGamemodeAnnouncer",
]],
[["disableGamemodeCompletion()"], [
	"disableBuilt-inGamemodeCompletion",
]],
[["disableMusic()"], [
	"disableBuilt-inGamemodeMusic",
]],
[["_&disableRespawn"], [
	"disableBuilt-inGamemodeRespawning",
]],
[["disableScoring()"], [
	"disableBuilt-inGamemodeScoring",
]],
[["_&disableDeathSpectateAllPlayers"], [
	"disableDeathSpectateAllPlayers",
]],
[["_&disableDeathSpectateTargetHud"], [
	"disableDeathSpectateTargetHud",
]],
[["_&disallowButton"], [
	"disallowButton",
]],
[["enableAnnouncer()"], [
	"enableBuilt-inGamemodeAnnouncer",
]],
[["enableGamemodeCompletion()"], [
	"enableBuilt-inGamemodeCompletion",
]],
[["enableMusic()"], [
	"enableBuilt-inGamemodeMusic",
]],
[["enableScoring()"], [
	"enableBuilt-inGamemodeScoring",
]],
[["_&enableRespawn"], [
	"enableBuilt-inGamemodeRespawning",
]],
[["_&enableDeathSpectateAllPlayers"], [
	"enableDeathSpectateAllPlayers",
]],
[["_&enableDeathSpectateTargetHud"], [
	"enableDeathSpectateTargetHud",
]],
[["goToAssembleHeroes()"], [
	"goToAssembleHeroes",
]],
[["heal"], [
	"heal",
]],
[["kill"], [
	"kill",
]],
[["_loop"], [
	"loop",
]],
[["_loopIf"], [
	"loopIf",
]],
[["_loopIfConditionIsFalse"], [
	"loopIfConditionIsFalse",
]],
[["_loopIfConditionIsTrue"], [
	"loopIfConditionIsTrue",
]],
[["_modifyGlobalVar"], [
	"modifyGlobalVariable",
]],
[["_modifyGlobalVarAtIndex"], [
	"modifyGlobalVariableAtIndex",
]],
[["_&addToScore"], [
	"modifyPlayerScore",
]],
[["_modifyPlayerVar"], [
	"modifyPlayerVariable",
]],
[["_modifyPlayerVarAtIndex"], [
	"modifyPlayerVariableAtIndex",
]],
[["addToTeamScore"], [
	"modifyTeamScore",
]],
[["pauseMatchTime()"], [
	"pauseMatchTime",
]],
[["playEffect"], [
	"playEffect",
]],
[["_&preloadHero"], [
	"preloadHero",
]],
[["_&forceButtonPress"], [
	"pressButton",
]],
[["_&resetHeroAvailability"], [
	"resetPlayerHeroAvailability",
]],
[["_&respawn"], [
	"respawn",
]],
[["_&resurrect"], [
	"resurrect",
]],
[["_&setAbility1Enabled"], [
	"setAbility1Enabled",
]],
[["_&setAbility2Enabled"], [
	"setAbility2Enabled",
]],
[["_&setAimSpeed"], [
	"setAimSpeed",
]],
[["_&setCamera"], [
	"startCamera",
]],
[["_&startFacing"], [
	"startFacing",
]],
[["_&setDamageDealt"], [
	"setDamageDealt",
]],
[["_&setDamageReceived"], [
	"setDamageReceived",
]],
[["_&setFacing"], [
	"setFacing",
]],
[["_&setInvisibility"], [
	"setInvisible",
]],
[["_setGlobalVar"], [
	"setGlobalVariable",
]],
[["_setGlobalVarAtIndex"], [
	"setGlobalVariableAtIndex",
]],
[["_&setGravity"], [
	"setGravity",
]],
[["_&setHealingDealt"], [
	"setHealingDealt",
]],
[["setMatchTime"], [
	"setMatchTime",
]],
[["_&setMaxHealth"], [
	"setMaxHealth",
]],
[["_&setMoveSpeed"], [
	"setMoveSpeed",
]],
[["_&setAllowedHeroes"], [
	"setPlayerAllowedHeroes",
]],
[["_&setScore"], [
	"setPlayerScore",
]],
[["_setPlayerVar"], [
	"setPlayerVariable",
]],
[["_setPlayerVarAtIndex"], [
	"setPlayerVariableAtIndex",
]],
[["_&setPrimaryFireEnabled"], [
	"setPrimaryFireEnabled",
]],
[["_&setProjectileGravity"], [
	"setProjectileGravity",
]],
[["_&setProjectileSpeed"], [
	"setProjectileSpeed",
]],
[["_&setRespawnTime"], [
	"setRespawnMaxTime",
]],
[["_&setSecondaryFireEnabled"], [
	"setSecondaryFireEnabled",
]],
[["setSlowMotion"], [
	"setSlowMotion",
]],
[["_&setStatusEffect"], [
	"setStatus",
]],
[["setTeamScore"], [
	"setTeamScore",
]],
[["_&setUltCharge"], [
	"setUltimateCharge",
]],
[["_&setUltEnabled"], [
	"setUltimateAbilityEnabled",
]],
[["_skip"], [
	"skip",
]],
[["_skipIf"], [
	"skipIf",
]],
[["smallMessage"], [
	"smallMessage",
]],
[["_&startAcceleration"], [
	"startAccelerating",
]],
[["startDamageModification"], [
	"startDamageModification",
]],
[["_&startDoT"], [
	"startDamageOverTime",
]],
[["_&startForcingHero"], [
	"startForcingPlayerToBeHero",
]],
[["_&startForcingThrottle"], [
	"startForcingThrottle",
]],
[["_&startHoT"], [
	"startHealOverTime",
]],
[["_&startForcingButton"], [
	"startHoldingButton",
]],
[["_&stopAcceleration"], [
	"stopAccelerating",
]],
[["stopAllDamageModifications"], [
	"stopAllDamageModifications",
]],
[["_&stopAllDoT"], [
	"stopAllDamageOverTime",
]],
[["_&stopAllHoT"], [
	"stopAllHealOverTime",
]],
[["_&stopCamera"], [
	"stopCamera",
]],
[["_stopChasingGlobalVariable"], [
	"stopChasingGlobalVariable",
]],
[["_stopChasingPlayerVariable"], [
	"stopChasingPlayerVariable",
]],
[["stopDoT"], [
	"stopDamageOverTime",
]],
[["_&stopFacing"], [
	"stopFacing",
]],
[["_&stopForcingCurrentHero"], [
	"stopForcingPlayerToBeHero",
]],
[["_&stopForcingThrottle"], [
	"stopForcingThrottle",
]],
[["_&stopForcingButton"], [
	"stopHoldingButton",
]],
[["stopHoT"], [
	"stopHealOverTime",
]],
[["_&teleport"], [
	"teleport",
]],
[["unpauseMatchTime()"], [
	"unpauseMatchTime",
]],
[["_wait"], [
	"wait",
]],

];

//A value function is defined as a function that returns a value.
var valueFuncKw = [

[["abs"], [
	"absoluteValue",
]],
[["_add"], [
	"add",
]],
[["_and"], [
	"and",
]],
[["getAllHeroes()"], [
	"allHeroes",
]],
[["_&getAllowedHeroes"], [
	"allowedHeroes",
]],
[["_&getAltitude"], [
	"altitudeOf",
]],
[["_appendToArray"], [
	"appendToArray",
]],
[["angleDifference"], [
	"angleDifference",
]],
[["attacker"], [
	"attacker",
]],
[["getAllDeadPlayers"], [
	"allDeadPlayers",
]],
[["getAllLivingPlayers"], [
	"allLivingPlayers",
]],
[["getAllPlayers"], [
	"allPlayers",
]],
[["_arrayContains"], [
	"arrayContains",
]],
[["_arraySlice"], [
	"arraySlice",
]],
[["Vector.BACKWARD"], [
	"backward",
]],
[["_&getClosestPlayer"], [
	"closestPlayerTo",
]],
[["_compare"], [
	"compare",
]],
[["cos"], [
	"cosineFromRadians",
]],
[["cosDeg"], [
	"cosineFromDegrees",
]],
[["len"], [
	"countOf",
]],
[["_currentArrayElement"], [
	"currentArrayElement",
]],
[["angleToDirection"], [
	"directionFromAngles",
]],
[["directionTowards"], [
	"directionTowards",
]],
[["distance"], [
	"distanceBetween",
]],
[["_divide"], [
	"divide",
]],
[["dotProduct"], [
	"dotProduct",
]],
[["Vector.DOWN"], [
	"down",
]],
[["_emptyArray"], [
	"emptyArray",
]],
[["entityExists"], [
	"entityExists",
]],
[["eventDamage"], [
	"eventDamage",
]],
[["eventPlayer"], [
	"eventPlayer",
]],
[["eventWasCriticalHit"], [
	"eventWasCriticalHit",
]],
[["_&getEyePosition"], [
	"eyePosition",
]],
[["_&getFacingDirection"], [
	"facingDirectionOf",
]],
[["_filteredArray"], [
	"filteredArray",
]],
[["_firstOf"], [
	"firstOf",
]],
[["Vector.FORWARD"], [
	"forward",
]],
[["_globalVar"], [
	"globalVariable",
]],
[["_&hasSpawned"], [
	"hasSpawned",
]],
[["_&hasStatusEffect"], [
	"hasStatus",
]],
[["_&getHealth"], [
	"health",
]],
[["_hero"], [
	"hero",
]],
[["heroIcon"], [
	"heroIconString",
]],
[["_&getCurrentHero"], [
	"heroOf",
]],
[["horizontalAngleOfDirection"], [
	"horizontalAngleFromDirection",
]],
[["_&getNbDeaths"], [
	"numberOfDeaths",
]],
[["horizontalAngleFromDirection"], [
	"horizontalAngleFromDirection",
]],
[["horizontalAngleTowards"], [
	"horizontalAngleTowards",
]],
[["_&getHorizontalFacingAngle"], [
	"horizontalFacingAngleOf",
]],
[["_&getHorizontalSpeed"], [
	"horizontalSpeedOf",
]],
[["_indexOfArrayValue"], [
	"indexOfArrayValue",
]],
[["_&isAlive"], [
	"isAlive",
]],
[["isAssemblingHeroes()"], [
	"isAssemblingHeroes",
]],
[["isMatchBetweenRounds()"], [
	"isBetweenRounds",
]],
[["_&isHoldingButton"], [
	"isButtonHeld",
]],
[["_&isCommunicating"], [
	"isCommunicating",
]],
[["_&isCommunicatingAnything"], [
	"isCommunicatingAny",
]],
[["_&isCommunicatingEmote"], [
	"isCommunicatingAnyEmote",
]],
[["_&isCommunicatingVoiceline"], [
	"isCommunicatingAnyVoiceline",
]],
[["_&isCrouching"], [
	"isCrouching",
]],
[["_&isDead"], [
	"isDead",
]],
[["_&isFiringPrimaryFire"], [
	"isFiringPrimary",
]],
[["_&isFiringSecondaryFire"], [
	"isFiringSecondary",
]],
[["_!teamHasHero"], [
	"isHeroBeingPlayed",
]],
[["_&isInAir"], [
	"isInAir",
]],
[["_isInLineOfSight"], [
	"isInLineOfSight",
]],
[["isInSetup()"], [
	"isInSetup",
]],
[["isInSuddenDeath()"], [
	"isCtfModeInSuddenDeath",
]],
[["_&isInSpawnRoom"], [
	"isInSpawnRoom",
]],
[["_&isInViewAngle"], [
	"isInViewAngle",
]],
[["isMatchComplete()"], [
	"isMatchComplete",
]],
[["_&isMoving"], [
	"isMoving",
]],
[["_&isOnGround"], [
	"isOnGround",
]],
[["_&isOnWall"], [
	"isOnWall",
]],
[["_&isUsingAbility1"], [
	"isUsingAbility1",
]],
[["_&isUsingAbility2"], [
	"isUsingAbility2",
]],
[["_&isUsingUltimate"], [
	"isUsingUltimate",
]],
[["isGameInProgress()"], [
	"isGameInProgress",
]],
[["_all"], [
	"isTrueForAll",
]],
[["_any"], [
	"isTrueForAny",
]],
[["getLastCreatedEntity()"], [
	"lastCreatedEntity",
]],
[["getLastDoT()"], [
	"lastDamageOverTimeId",
]],
[["getLastCreatedText()"], [
	"lastTextId",
]],
[["_lastOf"], [
	"lastOf",
]],
[["Vector.LEFT"], [
	"left",
]],
[["localVector"], [
	"localVectorOf",
]],
[["getMatchTime()"], [
	"matchTime",
]],
[["max"], [
	"max",
]],
[["_&getMaxHealth"], [
	"maxHealth",
]],
[["min"], [
	"min",
]],
[["_modulo"], [
	"modulo",
]],
[["_multiply"], [
	"multiply",
]],
[["nearestWalkablePosition"], [
	"nearestWalkablePosition",
]],
[["normalize"], [
	"normalize",
]],
[["not"], [
	"not",
]],
[["getNumberOfDeadPlayers"], [
	"numberOfDeadPlayers",
]],
[["getNumberOfLivingPlayers"], [
	"numberOfLivingPlayers",
]],
[["_!getNumberOfHeroes"], [
	"numberOfHeroes",
]],
[["getNumberOfPlayers"], [
	"numberOfPlayers",
]],
[["getObjectivePosition"], [
	"objectivePosition",
]],
[["getOppositeTeam"], [
	"oppositeTeamOf",
]],
[["_or"], [
	"or",
]],
[["_&getPlayerClosestToReticle"], [
	"playerClosestToReticle",
]],
[["_playerVar"], [
	"playerVariable",
]],
[["getPlayersInSlot"], [
	"playersInSlot",
]],
[["_&getPlayersInViewAngle"], [
	"playersInViewAngle",
]],
[["_!getPlayersOnHero"], [
	"playersOnHero",
]],
[["getPlayersInRadius"], [
	"playersWithinRadius",
]],
[["_&getPosition"], [
	"positionOf",
]],
[["_raiseToPower"], [
	"raiseToPower",
]],
[["random.randint"], [
	"randomInteger",
]],
[["random.shuffle"], [
	"randomizedArray",
]],
[["random.uniform"], [
	"randomReal",
]],
[["random.choice"], [
	"randomValueInArray",
]],
[["_getNormal"], [
	"raycastHitNormal",
]],
[["_getPlayerHit"], [
	"raycastHitPlayer",
]],
[["_getHitPosition"], [
	"raycastHitPosition",
]],
[["_removeFromArray"], [
	"removeFromArray",
]],
[["Vector.RIGHT"], [
	"right",
]],
[["_round"], [
	"roundToInteger",
]],
[["_&getScore"], [
	"scoreOf",
]],
[["sinDeg"], [
	"sineFromDegrees",
]],
[["sin"], [
	"sineFromRadians",
]],
[["_&getSlot"], [
	"slotOf",
]],
[["_sortedArray"], [
	"sortedArray",
]],
[["_&getSpeed"], [
	"speedOf",
]],
[["sqrt"], [
	"squareRoot",
]],
[["_string"], [
	"string",
]],
[["_subtract"], [
	"subtract",
]],
[["_&getTeam"], [
	"teamOf",
]],
[["teamScore"], [
	"teamScore",
]],
[["_&getThrottle"], [
	"throttleOf",
]],
[["getTotalTimeElapsed"], [
	"totalTimeElapsed",
]],
[["_&getUltCharge"], [
	"ultimateChargePercent",
]],
[["Vector.UP"], [
	"up",
]],
[["_valueInArray"], [
	"valueInArray",
]],
[["vectorTowards"], [
	"vectorTowards",
]],
[["vect"], [
	"vector",
]],
[["_&getVelocity"], [
	"velocityOf",
]],
[["verticalAngleOfDirection"], [
	"verticalAngleFromDirection",
]],
[["verticalAngleTowards"], [
	"verticalAngleTowards",
]],
[["_&getVerticalFacingAngle"], [
	"verticalFacingAngleOf",
]],
[["_&getVerticalSpeed"], [
	"verticalSpeedOf",
]],
[["victim"], [
	"victim",
]],
[["worldVector"], [
	"worldVectorOf",
]],
[["_xComponentOf"], [
	"xComponentOf",
]],
[["_yComponentOf"], [
	"yComponentOf",
]],
[["_zComponentOf"], [
	"zComponentOf",
]],

];

var heroKw = [

[["Hero.ANA"], [
    "ana",
]],
[["Hero.ASHE"], [
    "ashe",
]],
[["Hero.BAPTISTE"], [
    "baptiste",
]],
[["Hero.BASTION"], [
    "bastion",
]],
[["Hero.BRIGITTE"], [
    "brigitte",
]],
[["Hero.DVA"], [
    "d.va",
]],
[["Hero.DOOMFIST"], [
    "doomfist",
]],
[["Hero.GENJI"], [
    "genji",
]],
[["Hero.HANZO"], [
    "hanzo",
]],
[["Hero.JUNKRAT"], [
    "junkrat",
]],
[["Hero.LUCIO"], [
    "lúcio",
]],
[["Hero.MCCREE"], [
    "mccree",
]],
[["Hero.MEI"], [
    "mei",
]],
[["Hero.MERCY"], [
    "mercy",
]],
[["Hero.MOIRA"], [
    "moira",
]],
[["Hero.ORISA"], [
    "orisa",
]],
[["Hero.PHARAH"], [
    "pharah",
]],
[["Hero.REAPER"], [
    "reaper",
]],
[["Hero.REINHARDT"], [
    "reinhardt",
]],
[["Hero.ROADHOG"], [
    "roadhog",
]],
[["Hero.SOLDIER"], [
    "soldier:76",
]],
[["Hero.SOMBRA"], [
    "sombra",
]],
[["Hero.SYMMETRA"], [
    "symmetra",
]],
[["Hero.TORBJORN"], [
    "torbjörn",
]],
[["Hero.TRACER"], [
    "tracer",
]],
[["Hero.WIDOWMAKER"], [
    "widowmaker",
]],
[["Hero.WINSTON"], [
    "winston",
]],
[["Hero.HAMMOND"], [
    "wreckingball",
]],
[["Hero.ZARYA"], [
    "zarya",
]],
[["Hero.ZENYATTA"], [
    "zenyatta",
]],

];

var boolKw = [

[["false"], [
	"false",
]],
[["null"], [
	"null",
]],
[["true"], [
	"true",
]],

];

var roundKw = [

[["_roundUp"], [
	"up",
]],
[["_roundDown"], [
	"down",
]],
[["_roundToNearest"], [
	"toNearest",
]],

];

var operationKw = [

[["_add"], [
    "add",
]],
[["_appendToArray"], [
    "appendtoarray",
]],
[["_divide"], [
    "divide",
]],
[["_max"], [
    "max",
]],
[["_min"], [
    "min",
]],
[["_modulo"], [
    "modulo",
]],
[["_multiply"], [
    "multiply",
]],
[["_raiseToPower"], [
    "raisetopower",
]],
[["_removeFromArrayByIndex"], [
    "removefromarraybyindex",
]],
[["_removeFromArrayByValue"], [
    "removefromarraybyvalue",
]],
[["_subtract"], [
    "subtract",
]],

];

var teamKw = [

[["Team.ALL"], [
	"allTeams",
]],
[["Team.1"], [
	"team1",
]],
[["Team.2"], [
	"team2",
]],

];

var positionKw = [

[["Position.LEFT"], [
	"left",
]],
[["Position.TOP"], [
	"top",
]],
[["Position.RIGHT"], [
	"right",
]],

];

var colorKw = [

[["Color.BLUE"], [
	"blue",
]],
[["Color.GREEN"], [
	"green",
]],
[["Color.PURPLE"], [
	"purple",
]],
[["Color.RED"], [
	"red",
]],
[["Color.TEAM_1"], [
	"team1",
]],
[["Color.TEAM_2"], [
	"team2",
]],
[["Color.WHITE"], [
	"white",
]],
[["Color.YELLOW"], [
	"yellow",
]],

];

var effectKw = [

[["Effect.BAD_AURA"], [
    "badaura",
]],
[["Effect.BAD_AURA_SOUND"], [
    "badaurasound",
]],
[["Effect.BEACON_SOUND"], [
    "beaconsound",
]],
[["Effect.CLOUD"], [
    "cloud",
]],
[["Effect.DECAL_SOUND"], [
    "decalsound",
]],
[["Effect.ENERGY_SOUND"], [
    "energysound",
]],
[["Effect.GOOD_AURA"], [
    "goodaura",
]],
[["Effect.GOOD_AURA_SOUND"], [
    "goodaurasound",
]],
[["Effect.LIGHT_SHAFT"], [
    "lightshaft",
]],
[["Effect.ORB"], [
    "orb",
]],
[["Effect.PICK-UP_SOUND"], [
    "pick-upsound",
]],
[["Effect.RING"], [
    "ring",
]],
[["Effect.SMOKE_SOUND"], [
    "smokesound",
]],
[["Effect.SPARKLES"], [
    "sparkles",
]],
[["Effect.SPARKLES_SOUND"], [
    "sparklessound",
]],
[["Effect.SPHERE"], [
    "sphere",
]],

];

var playEffectKw = [

[["Effect.BAD_EXPLOSION"], [
    "badexplosion",
]],
[["Effect.BAD_PICKUP_EFFECT"], [
    "badpickupeffect",
]],
[["Effect.BUFF_EXPLOSION_SOUND"], [
    "buffexplosionsound",
]],
[["Effect.BUFF_IMPACT_SOUND"], [
    "buffimpactsound",
]],
[["Effect.DEBUFF_IMPACT_SOUND"], [
    "debuffimpactsound",
]],
[["Effect.EXPLOSION_SOUND"], [
    "explosionsound",
]],
[["Effect.GOOD_EXPLOSION"], [
    "goodexplosion",
]],
[["Effect.GOOD_PICKUP_EFFECT"], [
    "goodpickupeffect",
]],
[["Effect.RING_EXPLOSION"], [
    "ringexplosion",
]],
[["Effect.RING_EXPLOSION_SOUND"], [
    "ringexplosionsound",
]],

];

var iconKw = [

[["Icon.ARROW_DOWN"], [
    "arrow:down",
]],
[["Icon.ARROW_LEFT"], [
    "arrow:left",
]],
[["Icon.ARROW_RIGHT"], [
    "arrow:right",
]],
[["Icon.ARROW_UP"], [
    "arrow:up",
]],
[["Icon.ASTERISK"], [
    "asterisk",
]],
[["Icon.BOLT"], [
    "bolt",
]],
[["Icon.CHECKMARK"], [
    "checkmark",
]],
[["Icon.CIRCLE"], [
    "circle",
]],
[["Icon.CLUB"], [
    "club",
]],
[["Icon.DIAMOND"], [
    "diamond",
]],
[["Icon.DIZZY"], [
    "dizzy",
]],
[["Icon.EXCLAMATION_MARK"], [
    "exclamationmark",
]],
[["Icon.EYE"], [
    "eye",
]],
[["Icon.FIRE"], [
    "fire",
]],
[["Icon.FLAG"], [
    "flag",
]],
[["Icon.HALO"], [
    "halo",
]],
[["Icon.HAPPY"], [
    "happy",
]],
[["Icon.HEART"], [
    "heart",
]],
[["Icon.MOON"], [
    "moon",
]],
[["Icon.NO"], [
    "no",
]],
[["Icon.PLUS"], [
    "plus",
]],
[["Icon.POISON"], [
    "poison",
]],
[["Icon.POISON_2"], [
    "poison2",
]],
[["Icon.QUESTION_MARK"], [
    "questionmark",
]],
[["Icon.RADIOACTIVE"], [
    "radioactive",
]],
[["Icon.RECYCLE"], [
    "recycle",
]],
[["Icon.RING_THICK"], [
    "ringthick",
]],
[["Icon.RING_THIN"], [
    "ringthin",
]],
[["Icon.SAD"], [
    "sad",
]],
[["Icon.SKULL"], [
    "skull",
]],
[["Icon.SPADE"], [
    "spade",
]],
[["Icon.SPIRAL"], [
    "spiral",
]],
[["Icon.STOP"], [
    "stop",
]],
[["Icon.TRASHCAN"], [
    "trashcan",
]],
[["Icon.WARNING"], [
    "warning",
]],
[["Icon.CROSS"], [
    "x",
]],

];

var reevaluationKw = [

[["Reeval.DESTINATION_AND_RATE"], [
	"destinationAndRate",
]],
[["Reeval.DESTINATION_AND_DURATION"], [
	"destinationAndDuration",
]],
[["Reeval.DIRECTION_AND_TURN_RATE"], [
	"directionAndTurnRate",
]],
[["Reeval.DIRECTION_RATE_AND_MAX_SPEED"], [
	"directionRateAndMaxSpeed",
]],
[["Reeval.POSITION"], [
	"position",
]],
[["Reeval.POSITION_AND_RADIUS"], [
	"positionAndRadius",
]],
[["Reeval.NONE"], [
	"none",
]],
[["Reeval.STRING"], [
	"string",
]],
[["Reeval.RECEIVERS_DAMAGERS_AND_DMGPERCENT"], [
	"receiversDamagersAndDamagePercent",
]],
[["Reeval.VISIBILITY"], [
	"visibleTo",
]],
[["Reeval.VISIBILITY_AND_POSITION"], [
	"visibleToAndPosition",
]],
[["Reeval.VISIBILITY_AND_STRING"], [
	"visibleToAndString",
]],
[["Reeval.VISIBILITY_POSITION_AND_RADIUS"], [
	"visibleToPositionAndRadius",
]],
[["Reeval.VISIBILITY_POSITION_AND_STRING"], [
	"visibleToPositionAndString",
]],

];

var relativeKw = [

[["Relativity.TO_PLAYER"], [
	"toPlayer",
]],
[["Relativity.TO_WORLD"], [
	"toWorld",
]],

];

var impulseKw = [

[["Impulse.CANCEL_CONTRARY_MOTION"], [
	"cancelContraryMotion",
]],
[["Impulse.INCORPORATE_CONTRARY_MOTION"], [
	"incorporateContraryMotion",
]],

];

var buttonKw = [

[["Button.ABILITY_1"], [
    "ability1",
]],
[["Button.ABILITY_2"], [
    "ability2",
]],
[["Button.CROUCH"], [
    "crouch",
]],
[["Button.INTERACT"], [
    "interact",
]],
[["Button.JUMP"], [
    "jump",
]],
[["Button.PRIMARY_FIRE"], [
    "primaryfire",
]],
[["Button.SECONDARY_FIRE"], [
    "secondaryfire",
]],
[["Button.ULTIMATE"], [
    "ultimate",
]],

];


var waitKw = [

[["Wait.ABORT_WHEN_FALSE"], [
	"abortWhenFalse",
]],
[["Wait.IGNORE_CONDITION"], [
	"ignoreCondition",
]],
[["Wait.RESTART_WHEN_TRUE"], [
	"restartWhenTrue",
]],

];

var transformationKw = [

[["Transform.ROTATION"], [
	"rotation",
]],
[["Transform.ROTATION_AND_TRANSLATION"], [
	"rotationAndTranslation",
]],

];

var losCheckKw = [

[["LosCheck.OFF"], [
    "off",
]],
[["LosCheck.SURFACES"], [
    "surfaces",
]],
[["LosCheck.SURFACES_AND_ALL_BARRIERS"], [
    "surfacesandallbarriers",
]],
[["LosCheck.SURFACES_AND_ENEMY_BARRIERS"], [
    "surfacesandenemybarriers",
]],
[["LosCheck.BLOCKED_BY_ENEMY_BARRIERS"], [
    "enemyBarriersBlockLos",
]],
[["LosCheck.BLOCKED_BY_ALL_BARRIERS"], [
    "allBarriersBlockLos",
]],
[["LosCheck.PASS_THROUGH_BARRIERS"], [
    "barriersDoNotBlockLos",
]],

];

var statusKw = [

[["Status.ASLEEP"], [
    "asleep",
]],
[["Status.BURNING"], [
    "burning",
]],
[["Status.FROZEN"], [
    "frozen",
]],
[["Status.HACKED"], [
    "hacked",
]],
[["Status.INVINCIBLE"], [
    "invincible",
]],
[["Status.KNOCKED_DOWN"], [
    "knockeddown",
]],
[["Status.PHASED_OUT"], [
    "phasedout",
]],
[["Status.ROOTED"], [
    "rooted",
]],
[["Status.STUNNED"], [
    "stunned",
]],
[["Status.UNKILLABLE"], [
    "unkillable",
]],

];

var commsKw = [

[["Comms.ACKNOWLEDGE"], [
    "acknowledge",
]],
[["Comms.EMOTE_DOWN"], [
    "emotedown",
]],
[["Comms.EMOTE_LEFT"], [
    "emoteleft",
]],
[["Comms.EMOTE_RIGHT"], [
    "emoteright",
]],
[["Comms.EMOTE_UP"], [
    "emoteup",
]],
[["Comms.GROUP_UP"], [
    "groupup",
]],
[["Comms.HELLO"], [
    "hello",
]],
[["Comms.NEED_HEALING"], [
    "needhealing",
]],
[["Comms.THANKS"], [
    "thanks",
]],
[["Comms.ULTIMATE_STATUS"], [
    "ultimatestatus",
]],
[["Comms.VOICE_LINE_DOWN"], [
    "voicelinedown",
]],
[["Comms.VOICE_LINE_LEFT"], [
    "voicelineleft",
]],
[["Comms.VOICE_LINE_RIGHT"], [
    "voicelineright",
]],
[["Comms.VOICE_LINE_UP"], [
    "voicelineup",
]],

];

var clipKw = [

[["Clip.SURFACES"], [
	"clipAgainstSurfaces",
]],
[["Clip.NONE"], [
	"doNotClip",
]],

];

var invisKw = [

[["Invis.ALL"], [
	"all",
]],
[["Invis.ENEMIES"], [
	"enemies",
]],
[["Invis.NONE"], [
	"none",
]],

];

//Global variables, used to convert to names during decompilation.
var globalVarKw = [

[["A"], [
    "A",
]],
[["B"], [
    "B",
]],
[["C"], [
    "C",
]],
[["D"], [
    "D",
]],
[["E"], [
    "E",
]],
[["F"], [
    "F",
]],
[["G"], [
    "G",
]],
[["H"], [
    "H",
]],
[["I"], [
    "I",
]],
[["J"], [
    "J",
]],
[["K"], [
    "K",
]],
[["L"], [
    "L",
]],
[["M"], [
    "M",
]],
[["N"], [
    "N",
]],
[["O"], [
    "O",
]],
[["P"], [
    "P",
]],
[["Q"], [
    "Q",
]],
[["R"], [
    "R",
]],
[["S"], [
    "S",
]],
[["T"], [
    "T",
]],
[["U"], [
    "U",
]],
[["V"], [
    "V",
]],
[["W"], [
    "W",
]],
[["X"], [
    "X",
]],
[["Y"], [
    "Y",
]],
[["Z"], [
    "Z",
]],

];

var playerVarKw = [

[["A"], [
    "A",
]],
[["B"], [
    "B",
]],
[["C"], [
    "C",
]],
[["D"], [
    "D",
]],
[["E"], [
    "E",
]],
[["F"], [
    "F",
]],
[["G"], [
    "G",
]],
[["H"], [
    "H",
]],
[["I"], [
    "I",
]],
[["J"], [
    "J",
]],
[["K"], [
    "K",
]],
[["L"], [
    "L",
]],
[["M"], [
    "M",
]],
[["N"], [
    "N",
]],
[["O"], [
    "O",
]],
[["P"], [
    "P",
]],
[["Q"], [
    "Q",
]],
[["R"], [
    "R",
]],
[["S"], [
    "S",
]],
[["T"], [
    "T",
]],
[["U"], [
    "U",
]],
[["V"], [
    "V",
]],
[["W"], [
    "W",
]],
[["X"], [
    "X",
]],
[["Y"], [
    "Y",
]],
[["Z"], [
    "Z",
]],

];

//This is not a keyword list like the others (used for translation).
//Rather, it is a list of keywords that can be integrated into strings (eg: hero names, team names, numbers, etc).
var stringKw = [];
for (var i = 0; i < heroKw.length; i++) {
	stringKw.push(heroKw[i][0][0]);
}

//A constant is defined as anything that isn't a function (or variable).
var constantKw = heroKw.concat(boolKw).concat(roundKw).concat(operationKw).concat(teamKw).concat(positionKw).concat(colorKw).concat(reevaluationKw).concat(waitKw).concat(effectKw).concat(iconKw).concat(relativeKw).concat(impulseKw).concat(buttonKw).concat(transformationKw).concat(losCheckKw).concat(statusKw).concat(commsKw).concat(playEffectKw).concat(clipKw).concat(invisKw);


//A value is defined as a function that returns a value (eg: "Has Spawned"), or a constant (number, vector, hero...)
var valueKw = valueFuncKw.concat(constantKw);

var funcKw = actionKw.concat(valueFuncKw);/* 
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

var emptyStrKw = [
[[""], [
    "",
]],
]

var normalStrKw = [

[["!"], [
    "!",
]],
[["!!"], [
    "!!",
]],
[["!!!"], [
    "!!!",
]],
[["*"], [
    "*",
]],
[["----------"], [
    "----------",
]],
[["..."], [
    "...",
]],
[["?"], [
    "?",
]],
[["??"], [
    "??",
]],
[["???"], [
    "???",
]],
[["Abilities"], [
    "Abilities",
]],
[["Ability"], [
    "Ability",
]],
[["Ability 1"], [
    "Ability 1",
]],
[["Ability 2"], [
    "Ability 2",
]],
[["Alert"], [
    "Alert",
]],
[["Alive"], [
    "Alive",
]],
[["Allies"], [
    "Allies",
]],
[["Ally"], [
    "Ally",
]],
[["Attack"], [
    "Attack",
]],
[["Attacked"], [
    "Attacked",
]],
[["Attacking"], [
    "Attacking",
]],
[["Attempt"], [
    "Attempt",
]],
[["Attempts"], [
    "Attempts",
]],
[["Average"], [
    "Average",
]],
[["Avoid"], [
    "Avoid",
]],
[["Avoided"], [
    "Avoided",
]],
[["Avoiding"], [
    "Avoiding",
]],
[["Backward"], [
    "Backward",
]],
[["Bad"], [
    "Bad",
]],
[["Ban"], [
    "Ban",
]],
[["Banned"], [
    "Banned",
]],
[["Banning"], [
    "Banning",
]],
[["Best"], [
    "Best",
]],
[["Better"], [
    "Better",
]],
[["Boss"], [
    "Boss",
]],
[["Bosses"], [
    "Bosses",
]],
[["Bought"], [
    "Bought",
]],
[["Build"], [
    "Build",
]],
[["Building"], [
    "Building",
]],
[["Built"], [
    "Built",
]],
[["Burn"], [
    "Burn",
]],
[["Burning"], [
    "Burning",
]],
[["Burnt"], [
    "Burnt",
]],
[["Buy"], [
    "Buy",
]],
[["Buying"], [
    "Buying",
]],
[["Capture"], [
    "Capture",
]],
[["Captured"], [
    "Captured",
]],
[["Capturing"], [
    "Capturing",
]],
[["Caution"], [
    "Caution",
]],
[["Center"], [
    "Center",
]],
[["Challenge Accepted"], [
    "Challenge Accepted",
]],
[["Chase"], [
    "Chase",
]],
[["Chased"], [
    "Chased",
]],
[["Chasing"], [
    "Chasing",
]],
[["Checkpoint"], [
    "Checkpoint",
]],
[["Checkpoints"], [
    "Checkpoints",
]],
[["Cloud"], [
    "Cloud",
]],
[["Clouds"], [
    "Clouds",
]],
[["Come Here"], [
    "Come Here",
]],
[["Condition"], [
    "Condition",
]],
[["Congratulations"], [
    "Congratulations",
]],
[["Connect"], [
    "Connect",
]],
[["Connected"], [
    "Connected",
]],
[["Connecting"], [
    "Connecting",
]],
[["Control Point"], [
    "Control Point",
]],
[["Control Points"], [
    "Control Points",
]],
[["Cooldown"], [
    "Cooldown",
]],
[["Cooldowns"], [
    "Cooldowns",
]],
[["Corrupt"], [
    "Corrupt",
]],
[["Corrupted"], [
    "Corrupted",
]],
[["Corrupting"], [
    "Corrupting",
]],
[["Credit"], [
    "Credit",
]],
[["Credits"], [
    "Credits",
]],
[["Critical"], [
    "Critical",
]],
[["Crouch"], [
    "Crouch",
]],
[["Crouched"], [
    "Crouched",
]],
[["Crouching"], [
    "Crouching",
]],
[["Current"], [
    "Current",
]],
[["Current Allies"], [
    "Current Allies",
]],
[["Current Ally"], [
    "Current Ally",
]],
[["Current Attempt"], [
    "Current Attempt",
]],
[["Current Checkpoint"], [
    "Current Checkpoint",
]],
[["Current Enemies"], [
    "Current Enemies",
]],
[["Current Enemy"], [
    "Current Enemy",
]],
[["Current Form"], [
    "Current Form",
]],
[["Current Game"], [
    "Current Game",
]],
[["Current Hero"], [
    "Current Hero",
]],
[["Current Heroes"], [
    "Current Heroes",
]],
[["Current Hostage"], [
    "Current Hostage",
]],
[["Current Hostages"], [
    "Current Hostages",
]],
[["Current Level"], [
    "Current Level",
]],
[["Current Mission"], [
    "Current Mission",
]],
[["Current Object"], [
    "Current Object",
]],
[["Current Objective"], [
    "Current Objective",
]],
[["Current Objects"], [
    "Current Objects",
]],
[["Current Phase"], [
    "Current Phase",
]],
[["Current Player"], [
    "Current Player",
]],
[["Current Players"], [
    "Current Players",
]],
[["Current Round"], [
    "Current Round",
]],
[["Current Target"], [
    "Current Target",
]],
[["Current Targets"], [
    "Current Targets",
]],
[["Current Upgrade"], [
    "Current Upgrade",
]],
[["Damage"], [
    "Damage",
]],
[["Damaged"], [
    "Damaged",
]],
[["Damaging"], [
    "Damaging",
]],
[["Danger"], [
    "Danger",
]],
[["Dead"], [
    "Dead",
]],
[["Defeat"], [
    "Defeat",
]],
[["Defend"], [
    "Defend",
]],
[["Defended"], [
    "Defended",
]],
[["Defending"], [
    "Defending",
]],
[["Deliver"], [
    "Deliver",
]],
[["Delivered"], [
    "Delivered",
]],
[["Delivering"], [
    "Delivering",
]],
[["Destabilize"], [
    "Destabilize",
]],
[["Destabilized"], [
    "Destabilized",
]],
[["Destabilizing"], [
    "Destabilizing",
]],
[["Destroy"], [
    "Destroy",
]],
[["Destroyed"], [
    "Destroyed",
]],
[["Destroying"], [
    "Destroying",
]],
[["Die"], [
    "Die",
]],
[["Disconnect"], [
    "Disconnect",
]],
[["Disconnected"], [
    "Disconnected",
]],
[["Disconnecting"], [
    "Disconnecting",
]],
[["Distance"], [
    "Distance",
]],
[["Distances"], [
    "Distances",
]],
[["Dodge"], [
    "Dodge",
]],
[["Dodged"], [
    "Dodged",
]],
[["Dodging"], [
    "Dodging",
]],
[["Dome"], [
    "Dome",
]],
[["Domes"], [
    "Domes",
]],
[["Down"], [
    "Down",
]],
[["Download"], [
    "Download",
]],
[["Downloaded"], [
    "Downloaded",
]],
[["Downloading"], [
    "Downloading",
]],
[["Draw"], [
    "Draw",
]],
[["Drop"], [
    "Drop",
]],
[["Dropped"], [
    "Dropped",
]],
[["Dropping"], [
    "Dropping",
]],
[["Dying"], [
    "Dying",
]],
[["East"], [
    "East",
]],
[["Eliminate"], [
    "Eliminate",
]],
[["Eliminated"], [
    "Eliminated",
]],
[["Eliminating"], [
    "Eliminating",
]],
[["Elimination"], [
    "Elimination",
]],
[["Eliminations"], [
    "Eliminations",
]],
[["Enemies"], [
    "Enemies",
]],
[["Enemy"], [
    "Enemy",
]],
[["Entrance"], [
    "Entrance",
]],
[["Escort"], [
    "Escort",
]],
[["Escorted"], [
    "Escorted",
]],
[["Escorting"], [
    "Escorting",
]],
[["Excellent"], [
    "Excellent",
]],
[["Exit"], [
    "Exit",
]],
[["Extreme"], [
    "Extreme",
]],
[["Failed"], [
    "Failed",
]],
[["Failing"], [
    "Failing",
]],
[["Failure"], [
    "Failure",
]],
[["Fall"], [
    "Fall",
]],
[["Fallen"], [
    "Fallen",
]],
[["Falling"], [
    "Falling",
]],
[["Far"], [
    "Far",
]],
[["Fast"], [
    "Fast",
]],
[["Faster"], [
    "Faster",
]],
[["Fastest"], [
    "Fastest",
]],
[["Fault"], [
    "Fault",
]],
[["Faults"], [
    "Faults",
]],
[["Final"], [
    "Final",
]],
[["Final Allies"], [
    "Final Allies",
]],
[["Final Ally"], [
    "Final Ally",
]],
[["Final Attempt"], [
    "Final Attempt",
]],
[["Final Checkpoint"], [
    "Final Checkpoint",
]],
[["Final Enemies"], [
    "Final Enemies",
]],
[["Final Enemy"], [
    "Final Enemy",
]],
[["Final Form"], [
    "Final Form",
]],
[["Final Game"], [
    "Final Game",
]],
[["Final Hero"], [
    "Final Hero",
]],
[["Final Heroes"], [
    "Final Heroes",
]],
[["Final Hostage"], [
    "Final Hostage",
]],
[["Final Hostages"], [
    "Final Hostages",
]],
[["Final Item"], [
    "Final Item",
]],
[["Final Level"], [
    "Final Level",
]],
[["Final Mission"], [
    "Final Mission",
]],
[["Final Object"], [
    "Final Object",
]],
[["Final Objective"], [
    "Final Objective",
]],
[["Final Objects"], [
    "Final Objects",
]],
[["Final Phase"], [
    "Final Phase",
]],
[["Final Player"], [
    "Final Player",
]],
[["Final Players"], [
    "Final Players",
]],
[["Final Round"], [
    "Final Round",
]],
[["Final Target"], [
    "Final Target",
]],
[["Final Targets"], [
    "Final Targets",
]],
[["Final Time"], [
    "Final Time",
]],
[["Final Upgrade"], [
    "Final Upgrade",
]],
[["Find"], [
    "Find",
]],
[["Finding"], [
    "Finding",
]],
[["Finish"], [
    "Finish",
]],
[["Finished"], [
    "Finished",
]],
[["Finishing"], [
    "Finishing",
]],
[["Flown"], [
    "Flown",
]],
[["Fly"], [
    "Fly",
]],
[["Flying"], [
    "Flying",
]],
[["Form"], [
    "Form",
]],
[["Forms"], [
    "Forms",
]],
[["Forward"], [
    "Forward",
]],
[["Found"], [
    "Found",
]],
[["Freeze"], [
    "Freeze",
]],
[["Freezing"], [
    "Freezing",
]],
[["Frozen"], [
    "Frozen",
]],
[["Game"], [
    "Game",
]],
[["Games"], [
    "Games",
]],
[["Games Lost"], [
    "Games Lost",
]],
[["Games Won"], [
    "Games Won",
]],
[["Gg"], [
    "Gg",
]],
[["Go"], [
    "Go",
]],
[["Goal"], [
    "Goal",
]],
[["Goals"], [
    "Goals",
]],
[["Going"], [
    "Going",
]],
[["Good"], [
    "Good",
]],
[["Good Luck"], [
    "Good Luck",
]],
[["Goodbye"], [
    "Goodbye",
]],
[["Guilty"], [
    "Guilty",
]],
[["Hack"], [
    "Hack",
]],
[["Hacked"], [
    "Hacked",
]],
[["Hacking"], [
    "Hacking",
]],
[["Heal"], [
    "Heal",
]],
[["Healed"], [
    "Healed",
]],
[["Healer"], [
    "Healer",
]],
[["Healers"], [
    "Healers",
]],
[["Healing"], [
    "Healing",
]],
[["Hello"], [
    "Hello",
]],
[["Help"], [
    "Help",
]],
[["Here"], [
    "Here",
]],
[["Hero"], [
    "Hero",
]],
[["Heroes"], [
    "Heroes",
]],
[["Hidden"], [
    "Hidden",
]],
[["Hide"], [
    "Hide",
]],
[["Hiding"], [
    "Hiding",
]],
[["High Score"], [
    "High Score",
]],
[["High Scores"], [
    "High Scores",
]],
[["Hmmm"], [
    "Hmmm",
]],
[["Hostage"], [
    "Hostage",
]],
[["Hostages"], [
    "Hostages",
]],
[["Huh"], [
    "Huh",
]],
[["Hunt"], [
    "Hunt",
]],
[["Hunted"], [
    "Hunted",
]],
[["Hunter"], [
    "Hunter",
]],
[["Hunters"], [
    "Hunters",
]],
[["Hunting"], [
    "Hunting",
]],
[["I Give Up"], [
    "I Give Up",
]],
[["I Tried"], [
    "I Tried",
]],
[["In View"], [
    "In View",
]],
[["Incoming"], [
    "Incoming",
]],
[["Initial"], [
    "Initial",
]],
[["Initial Allies"], [
    "Initial Allies",
]],
[["Initial Ally"], [
    "Initial Ally",
]],
[["Initial Attempt"], [
    "Initial Attempt",
]],
[["Initial Checkpoint"], [
    "Initial Checkpoint",
]],
[["Initial Enemies"], [
    "Initial Enemies",
]],
[["Initial Enemy"], [
    "Initial Enemy",
]],
[["Initial Form"], [
    "Initial Form",
]],
[["Initial Game"], [
    "Initial Game",
]],
[["Initial Hero"], [
    "Initial Hero",
]],
[["Initial Heroes"], [
    "Initial Heroes",
]],
[["Initial Hostage"], [
    "Initial Hostage",
]],
[["Initial Level"], [
    "Initial Level",
]],
[["Initial Mission"], [
    "Initial Mission",
]],
[["Initial Object"], [
    "Initial Object",
]],
[["Initial Objective"], [
    "Initial Objective",
]],
[["Initial Objects"], [
    "Initial Objects",
]],
[["Initial Phase"], [
    "Initial Phase",
]],
[["Initial Player"], [
    "Initial Player",
]],
[["Initial Players"], [
    "Initial Players",
]],
[["Initial Round"], [
    "Initial Round",
]],
[["Initial Target"], [
    "Initial Target",
]],
[["Initial Targets"], [
    "Initial Targets",
]],
[["Initial Upgrade"], [
    "Initial Upgrade",
]],
[["Innocent"], [
    "Innocent",
]],
[["Inside"], [
    "Inside",
]],
[["Invisible"], [
    "Invisible",
]],
[["Item"], [
    "Item",
]],
[["Items"], [
    "Items",
]],
[["Join"], [
    "Join",
]],
[["Joined"], [
    "Joined",
]],
[["Joining"], [
    "Joining",
]],
[["Jump"], [
    "Jump",
]],
[["Jumping"], [
    "Jumping",
]],
[["Kill"], [
    "Kill",
]],
[["Kills"], [
    "Kills",
]],
[["Killstreak"], [
    "Killstreak",
]],
[["Killstreaks"], [
    "Killstreaks",
]],
[["Leader"], [
    "Leader",
]],
[["Leaders"], [
    "Leaders",
]],
[["Least"], [
    "Least",
]],
[["Left"], [
    "Left",
]],
[["Less"], [
    "Less",
]],
[["Level"], [
    "Level",
]],
[["Levels"], [
    "Levels",
]],
[["Life"], [
    "Life",
]],
[["Limited"], [
    "Limited",
]],
[["Lives"], [
    "Lives",
]],
[["Load"], [
    "Load",
]],
[["Loaded"], [
    "Loaded",
]],
[["Loading"], [
    "Loading",
]],
[["Lock"], [
    "Lock",
]],
[["Locked"], [
    "Locked",
]],
[["Locking"], [
    "Locking",
]],
[["Loser"], [
    "Loser",
]],
[["Losers"], [
    "Losers",
]],
[["Loss"], [
    "Loss",
]],
[["Losses"], [
    "Losses",
]],
[["Max"], [
    "Max",
]],
[["Mild"], [
    "Mild",
]],
[["Min"], [
    "Min",
]],
[["Mission"], [
    "Mission",
]],
[["Mission"], [
    "Mission",
]],
[["Mission Aborted"], [
    "Mission Aborted",
]],
[["Mission Accomplished"], [
    "Mission Accomplished",
]],
[["Mission Failed"], [
    "Mission Failed",
]],
[["Missions"], [
    "Missions",
]],
[["Moderate"], [
    "Moderate",
]],
[["Money"], [
    "Money",
]],
[["More"], [
    "More",
]],
[["Most"], [
    "Most",
]],
[["My Mistake"], [
    "My Mistake",
]],
[["Near"], [
    "Near",
]],
[["New High Score"], [
    "New High Score",
]],
[["New Record"], [
    "New Record",
]],
[["Next"], [
    "Next",
]],
[["Next Allies"], [
    "Next Allies",
]],
[["Next Ally"], [
    "Next Ally",
]],
[["Next Attempt"], [
    "Next Attempt",
]],
[["Next Checkpoint"], [
    "Next Checkpoint",
]],
[["Next Enemies"], [
    "Next Enemies",
]],
[["Next Enemy"], [
    "Next Enemy",
]],
[["Next Form"], [
    "Next Form",
]],
[["Next Game"], [
    "Next Game",
]],
[["Next Hero"], [
    "Next Hero",
]],
[["Next Heroes"], [
    "Next Heroes",
]],
[["Next Hostage"], [
    "Next Hostage",
]],
[["Next Hostages"], [
    "Next Hostages",
]],
[["Next Level"], [
    "Next Level",
]],
[["Next Mission"], [
    "Next Mission",
]],
[["Next Object"], [
    "Next Object",
]],
[["Next Objective"], [
    "Next Objective",
]],
[["Next Objects"], [
    "Next Objects",
]],
[["Next Phase"], [
    "Next Phase",
]],
[["Next Player"], [
    "Next Player",
]],
[["Next Players"], [
    "Next Players",
]],
[["Next Round"], [
    "Next Round",
]],
[["Next Target"], [
    "Next Target",
]],
[["Next Targets"], [
    "Next Targets",
]],
[["Next Upgrade"], [
    "Next Upgrade",
]],
[["Nice Try"], [
    "Nice Try",
]],
[["No"], [
    "No",
]],
[["No Thanks"], [
    "No Thanks",
]],
[["None"], [
    "None",
]],
[["Normal"], [
    "Normal",
]],
[["North"], [
    "North",
]],
[["Northeast"], [
    "Northeast",
]],
[["Northwest"], [
    "Northwest",
]],
[["Not Today"], [
    "Not Today",
]],
[["Object"], [
    "Object",
]],
[["Objective"], [
    "Objective",
]],
[["Objectives"], [
    "Objectives",
]],
[["Objects"], [
    "Objects",
]],
[["Obtain"], [
    "Obtain",
]],
[["Obtained"], [
    "Obtained",
]],
[["Obtaining"], [
    "Obtaining",
]],
[["Off"], [
    "Off",
]],
[["On"], [
    "On",
]],
[["Oof"], [
    "Oof",
]],
[["Oops"], [
    "Oops",
]],
[["Optimal"], [
    "Optimal",
]],
[["Optimize"], [
    "Optimize",
]],
[["Optimized"], [
    "Optimized",
]],
[["Optimizing"], [
    "Optimizing",
]],
[["Out Of View"], [
    "Out Of View",
]],
[["Outgoing"], [
    "Outgoing",
]],
[["Outside"], [
    "Outside",
]],
[["Over"], [
    "Over",
]],
[["Overtime"], [
    "Overtime",
]],
[["Payload"], [
    "Payload",
]],
[["Payloads"], [
    "Payloads",
]],
[["Phase"], [
    "Phase",
]],
[["Phases"], [
    "Phases",
]],
[["Pick"], [
    "Pick",
]],
[["Picked"], [
    "Picked",
]],
[["Picking"], [
    "Picking",
]],
[["Player"], [
    "Player",
]],
[["Player"], [
    "Player",
]],
[["Players"], [
    "Players",
]],
[["Players"], [
    "Players",
]],
[["Point"], [
    "Point",
]],
[["Points"], [
    "Points",
]],
[["Points Earned"], [
    "Points Earned",
]],
[["Points Lost"], [
    "Points Lost",
]],
[["Power-Up"], [
    "Power-Up",
]],
[["Power-Ups"], [
    "Power-Ups",
]],
[["Price"], [
    "Price",
]],
[["Protect"], [
    "Protect",
]],
[["Protected"], [
    "Protected",
]],
[["Protecting"], [
    "Protecting",
]],
[["Purified"], [
    "Purified",
]],
[["Purify"], [
    "Purify",
]],
[["Purifying"], [
    "Purifying",
]],
[["Raise"], [
    "Raise",
]],
[["Raised"], [
    "Raised",
]],
[["Raising"], [
    "Raising",
]],
[["Rank"], [
    "Rank",
]],
[["Rank A"], [
    "Rank A",
]],
[["Rank B"], [
    "Rank B",
]],
[["Rank C"], [
    "Rank C",
]],
[["Rank D"], [
    "Rank D",
]],
[["Rank E"], [
    "Rank E",
]],
[["Rank F"], [
    "Rank F",
]],
[["Rank G"], [
    "Rank G",
]],
[["Ready"], [
    "Ready",
]],
[["Record"], [
    "Record",
]],
[["Records"], [
    "Records",
]],
[["Recover"], [
    "Recover",
]],
[["Recovered"], [
    "Recovered",
]],
[["Recovering"], [
    "Recovering",
]],
[["Remain"], [
    "Remain",
]],
[["Remaining"], [
    "Remaining",
]],
[["Rescue"], [
    "Rescue",
]],
[["Rescued"], [
    "Rescued",
]],
[["Rescuing"], [
    "Rescuing",
]],
[["Resurrect"], [
    "Resurrect",
]],
[["Resurrected"], [
    "Resurrected",
]],
[["Resurrecting"], [
    "Resurrecting",
]],
[["Reveal"], [
    "Reveal",
]],
[["Revealed"], [
    "Revealed",
]],
[["Revealing"], [
    "Revealing",
]],
[["Right"], [
    "Right",
]],
[["Round"], [
    "Round",
]],
[["Rounds"], [
    "Rounds",
]],
[["Rounds Lost"], [
    "Rounds Lost",
]],
[["Rounds Won"], [
    "Rounds Won",
]],
[["Run"], [
    "Run",
]],
[["Running"], [
    "Running",
]],
[["Safe"], [
    "Safe",
]],
[["Save"], [
    "Save",
]],
[["Saved"], [
    "Saved",
]],
[["Saving"], [
    "Saving",
]],
[["Score"], [
    "Score",
]],
[["Scores"], [
    "Scores",
]],
[["Secure"], [
    "Secure",
]],
[["Secured"], [
    "Secured",
]],
[["Securing"], [
    "Securing",
]],
[["Sell"], [
    "Sell",
]],
[["Selling"], [
    "Selling",
]],
[["Sever"], [
    "Sever",
]],
[["Severe"], [
    "Severe",
]],
[["Severed"], [
    "Severed",
]],
[["Severing"], [
    "Severing",
]],
[["Sink"], [
    "Sink",
]],
[["Sinking"], [
    "Sinking",
]],
[["Sleep"], [
    "Sleep",
]],
[["Sleeping"], [
    "Sleeping",
]],
[["Slept"], [
    "Slept",
]],
[["Slow"], [
    "Slow",
]],
[["Slower"], [
    "Slower",
]],
[["Slowest"], [
    "Slowest",
]],
[["Sold"], [
    "Sold",
]],
[["Sorry"], [
    "Sorry",
]],
[["South"], [
    "South",
]],
[["Southeast"], [
    "Southeast",
]],
[["Southwest"], [
    "Southwest",
]],
[["Sparkles"], [
    "Sparkles",
]],
[["Spawn"], [
    "Spawn",
]],
[["Spawned"], [
    "Spawned",
]],
[["Spawning"], [
    "Spawning",
]],
[["Sphere"], [
    "Sphere",
]],
[["Spheres"], [
    "Spheres",
]],
[["Stabilize"], [
    "Stabilize",
]],
[["Stabilized"], [
    "Stabilized",
]],
[["Stabilizing"], [
    "Stabilizing",
]],
[["Stable"], [
    "Stable",
]],
[["Star"], [
    "Star",
]],
[["Stars"], [
    "Stars",
]],
[["Start"], [
    "Start",
]],
[["Started"], [
    "Started",
]],
[["Starting"], [
    "Starting",
]],
[["Status"], [
    "Status",
]],
[["Stay Away"], [
    "Stay Away",
]],
[["Stop"], [
    "Stop",
]],
[["Stopped"], [
    "Stopped",
]],
[["Stopping"], [
    "Stopping",
]],
[["Stun"], [
    "Stun",
]],
[["Stunned"], [
    "Stunned",
]],
[["Stunning"], [
    "Stunning",
]],
[["Suboptimal"], [
    "Suboptimal",
]],
[["Success"], [
    "Success",
]],
[["Sudden Death"], [
    "Sudden Death",
]],
[["Sunk"], [
    "Sunk",
]],
[["Superb"], [
    "Superb",
]],
[["Survive"], [
    "Survive",
]],
[["Survived"], [
    "Survived",
]],
[["Surviving"], [
    "Surviving",
]],
[["Target"], [
    "Target",
]],
[["Targets"], [
    "Targets",
]],
[["Team"], [
    "Team",
]],
[["Teammate"], [
    "Teammate",
]],
[["Teammates"], [
    "Teammates",
]],
[["Teams"], [
    "Teams",
]],
[["Terrible"], [
    "Terrible",
]],
[["Thank You"], [
    "Thank You",
]],
[["Thanks"], [
    "Thanks",
]],
[["That Was Awesome"], [
    "That Was Awesome",
]],
[["Threat"], [
    "Threat",
]],
[["Threat Level"], [
    "Threat Level",
]],
[["Threat Levels"], [
    "Threat Levels",
]],
[["Threats"], [
    "Threats",
]],
[["Tiebreaker"], [
    "Tiebreaker",
]],
[["Time"], [
    "Time",
]],
[["Times"], [
    "Times",
]],
[["Total"], [
    "Total",
]],
[["Trade"], [
    "Trade",
]],
[["Traded"], [
    "Traded",
]],
[["Trading"], [
    "Trading",
]],
[["Traitor"], [
    "Traitor",
]],
[["Traitors"], [
    "Traitors",
]],
[["Transfer"], [
    "Transfer",
]],
[["Transferred"], [
    "Transferred",
]],
[["Transferring"], [
    "Transferring",
]],
[["Try Again"], [
    "Try Again",
]],
[["Turret"], [
    "Turret",
]],
[["Turrets"], [
    "Turrets",
]],
[["Ugh"], [
    "Ugh",
]],
[["Ultimate Ability"], [
    "Ultimate Ability",
]],
[["Under"], [
    "Under",
]],
[["Unknown"], [
    "Unknown",
]],
[["Unlimited"], [
    "Unlimited",
]],
[["Unlock"], [
    "Unlock",
]],
[["Unlocked"], [
    "Unlocked",
]],
[["Unlocking"], [
    "Unlocking",
]],
[["Unsafe"], [
    "Unsafe",
]],
[["Unstable"], [
    "Unstable",
]],
[["Up"], [
    "Up",
]],
[["Upgrade"], [
    "Upgrade",
]],
[["Upgrades"], [
    "Upgrades",
]],
[["Upload"], [
    "Upload",
]],
[["Uploaded"], [
    "Uploaded",
]],
[["Uploading"], [
    "Uploading",
]],
[["Use Ability 1"], [
    "Use Ability 1",
]],
[["Use Ability 2"], [
    "Use Ability 2",
]],
[["Use Ultimate Ability"], [
    "Use Ultimate Ability",
]],
[["Victory"], [
    "Victory",
]],
[["Visible"], [
    "Visible",
]],
[["Vortex"], [
    "Vortex",
]],
[["Vortices"], [
    "Vortices",
]],
[["Wait"], [
    "Wait",
]],
[["Waiting"], [
    "Waiting",
]],
[["Wall"], [
    "Wall",
]],
[["Walls"], [
    "Walls",
]],
[["Warning"], [
    "Warning",
]],
[["Well Played"], [
    "Well Played",
]],
[["West"], [
    "West",
]],
[["Win"], [
    "Win",
]],
[["Winner"], [
    "Winner",
]],
[["Winners"], [
    "Winners",
]],
[["Wins"], [
    "Wins",
]],
[["Worse"], [
    "Worse",
]],
[["Wow"], [
    "Wow",
]],
[["Yes"], [
    "Yes",
]],
[["You"], [
    "You",
]],
[["You Lose"], [
    "You Lose",
]],
[["You Win"], [
    "You Win",
]],
[["Zone"], [
    "Zone",
]],
[["Zones"], [
    "Zones",
]],

//Reverse alphabetical order to match longest first on tokenization.
].reverse();

var prefixStrKw = [

[["#{0}"], [
    "#{0}",
]],
[["-> {0}"], [
    "-> {0}",
]],
[["<-> {0}"], [
    "<-> {0}",
]],
[["<- {0}"], [
    "<- {0}",
]],
[["Round {0}"], [
    "Round {0}",
]],

];

var postfixStrKw = [
[["{0} ->"], [
    "{0} ->",
]],
[["{0} <->"], [
    "{0} <->",
]],
[["{0} <-"], [
    "{0} <-",
]],
[["{0} M/S"], [
    "{0} M/S",
]],
[["{0} M"], [
    "{0} M",
]],
[["{0} Sec"], [
    "{0} Sec",
]],
[["{0}!!!"], [
    "{0}!!!",
]],
[["{0}!!"], [
    "{0}!!",
]],
[["{0}!"], [
    "{0}!",
]],
[["{0}%"], [
    "{0}%",
]],
[["{0}:"], [
    "{0}:",
]],
[["{0}???"], [
    "{0}???",
]],
[["{0}??"], [
    "{0}??",
]],
[["{0}?"], [
    "{0}?",
]],
];

var binaryStrKw = [

[["{0} -> {1}"], [
    "{0} -> {1}",
]],
[["{0} - {1}"], [
    "{0} - {1}",
]],
[["{0} != {1}"], [
    "{0} != {1}",
]],
[["{0} * {1}"], [
    "{0} * {1}",
]],
[["{0} / {1}"], [
    "{0} / {1}",
]],
[["{0} + {1}"], [
    "{0} + {1}",
]],
[["{0} <-> {1}"], [
    "{0} <-> {1}",
]],
[["{0} <- {1}"], [
    "{0} <- {1}",
]],
[["{0} <= {1}"], [
    "{0} <= {1}",
]],
[["{0} < {1}"], [
    "{0} < {1}",
]],
[["{0} == {1}"], [
    "{0} == {1}",
]],
[["{0} = {1}"], [
    "{0} = {1}",
]],
[["{0} >= {1}"], [
    "{0} >= {1}",
]],
[["{0} > {1}"], [
    "{0} > {1}",
]],
[["{0} And {1}"], [
    "{0} And {1}",
]],
[["{0} Vs {1}"], [
    "{0} Vs {1}",
]],
[["{0}, {1}"], [
    "{0}, {1}",
]],
[["{0}: {1}"], [
    "{0}: {1}",
]],
[["{0}:{1}"], [
    "{0}:{1}",
]],
[["{0} {1}"], [
    "{0} {1}",
]],
];

var ternaryStrKw = [
[["{0} - {1} - {2}"], [
    "{0} - {1} - {2}",
]],
[["{0} : {1} : {2}"], [
    "{0} : {1} : {2}",
]],
[["{0} {1} {2}"], [
    "{0} {1} {2}",
]],
[["{0}, {1}, And {2}"], [
    "{0}, {1}, And {2}",
]],
[["{0}: {1} And {2}"], [
    "{0}: {1} And {2}",
]],
];

var surroundStrKw = [
[["({0})"], [
    "({0})",
]],
[["¡{0}!"], [
    "¡{0}!",
]],
[["¿{0}?"], [
    "¿{0}?",
]],
];

var stringKw = normalStrKw.concat(prefixStrKw).concat(postfixStrKw).concat(binaryStrKw).concat(ternaryStrKw).concat(surroundStrKw).concat(emptyStrKw);

var strTokens = [];

//Generate string tokens
//normal strings
for (var j = 0; j < normalStrKw.length; j++) {
	strTokens.push(normalStrKw[j][0][0].toLowerCase());
}

//prefix strings
for (var j = 0; j < prefixStrKw.length; j++) {
	strTokens.push(prefixStrKw[j][0][0].substring(0, prefixStrKw[j][0][0].indexOf("{0}")).toLowerCase());
}

//postfix strings
for (var j = 0; j < postfixStrKw.length; j++) {
	strTokens.push(postfixStrKw[j][0][0].substring("{0}".length).toLowerCase());
}

//ternary strings
for (var j = 0; j < ternaryStrKw.length; j++) {
	strTokens.push(ternaryStrKw[j][0][0].substring("{0}".length, ternaryStrKw[j][0][0].indexOf("{1}")).toLowerCase());
	strTokens.push(ternaryStrKw[j][0][0].substring(ternaryStrKw[j][0][0].indexOf("{1}")+"{1}".length, ternaryStrKw[j][0][0].indexOf("{2}")).toLowerCase());
}

//binary strings
for (var j = 0; j < binaryStrKw.length; j++) {
	strTokens.push(binaryStrKw[j][0][0].substring("{0}".length, binaryStrKw[j][0][0].indexOf("{1}")).toLowerCase());
}


//surround strings
for (var j = 0; j < surroundStrKw.length; j++) {
	strTokens.push(surroundStrKw[j][0][0][0].toLowerCase())
	strTokens.push(surroundStrKw[j][0][0][surroundStrKw[j][0][0].length-1].toLowerCase())
}

//heroes
for (var j = 0; j < heroKw.length; j++) {
	strTokens.push(heroKw[j][0][0].toLowerCase());
}

//Sort reverse alphabetical order for greediness
strTokens = strTokens.sort().reverse();
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

"use strict";

//Used for string parsing; splits an array of strings on one or two strings.
//Eg: splitStrTokens(["owo", "uwu", "owo"], "uwu") will return [["owo"], ["owo"]].
function splitStrTokens(tokens, str1, str2) {
	
	var str1Index = -1;
	var str2Index = -1;
	var bracketLevel = 0;
	
	if (str2 !== undefined) {
		debug("Splitting str tokens '"+tokens+"' on '"+str1+"' and '"+str2+"'");
	} else {
		debug("Splitting str tokens '"+tokens+"' on '"+str1+"'");
	}
	
	var i;
	for (i = 0; i < tokens.length; i++) {
		if (tokens[i] === str1 && bracketLevel === 0) {
			str1Index = i;
			break;
		} else if (tokens[i] === "(" || tokens[i] === "¡" || tokens[i] === "¿") {
			bracketLevel++;
		} else if ((tokens[i] === ")" || tokens[i] === "!" || tokens[i] === "?") && bracketLevel > 0) {
			bracketLevel--;
		}
	}
	
	i++;
	
	if (str2 !== undefined) {
		for (; i < tokens.length; i++) {
			if (tokens[i] === str2 && bracketLevel === 0) {
				str2Index = i;
				break;
			} else if (tokens[i] === "(" || tokens[i] === "¡" || tokens[i] === "¿") {
				bracketLevel++;
			} else if ((tokens[i] === ")" || tokens[i] === "!" || tokens[i] === "?") && bracketLevel > 0) {
				bracketLevel--;
			}
		}
	}
	
	//debug("str1Index = "+str1Index+", str2Index = "+str2Index);
	
	if (str1Index === -1) {
		return [tokens];
	} else if (str2Index === -1) {
		return [tokens.slice(0, str1Index), tokens.slice(str1Index+1)]
	} else {
		return [tokens.slice(0, str1Index), tokens.slice(str1Index+1, str2Index), tokens.slice(str2Index+1)]
	}
	
}

//Reverses the comparison operator.
function reverseOperator(content) {
	if (content === "==") return "!=";
	else if (content === '!=') return "==";
	else if (content === '<=') return ">";
	else if (content === '>=') return "<";
	else if (content === '<') return ">=";
	else if (content === '>') return "<=";
	else {
		error("Cannot reverse operator "+content);
	}
}

//Returns true if the given token array is an instruction (not goto/label).
function lineIsInstruction(line, previousLineIsIf) {
	
	//Check for label
	if (line[line.length-1].text === ':' && line[0].text !== "if" && line[0].text !== "for") {
		return false;
	}
	if (line[0].text === "for") {
		return false;
	}
	if (previousLineIsIf && (line[0].text === "goto" || line[0].text === "return" || line[0].text === "continue")) {
		return false;
	}
	
	return true;
}

//Replaces variables A-Z with the provided names (for decompilation).
//Also returns "#define name var" for each name.
function loadVariableNames(names, varKw) {
	var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	var result = "";
	for (const [key,value] of Object.entries(names)) {
		var index = alphabet.indexOf(key.toUpperCase());
		if (index < 0) {
			error("Illegal variable "+key);
		} else {
			varKw[index][0][0] = value;
			result += "#!define "+value+" "+key.toUpperCase()+"\n";
		}
	}
	return result;
}

//Resets variable names to A-Z.
function resetVarNames(varKw) {
	var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	for (var i = 0; i < alphabet.length; i++) {
		varKw[i][0][0] = alphabet[i];
	}
}

//Gets the name of a function.
function getName(content) {
	
	if (content === undefined) {
		error("Trying to get name of undefined function");
	}
	
	var bracketPos = getBracketPositions(content);
	
	if (bracketPos.length == 2) {
		var name = content.substring(0, bracketPos[0]);
	} else {
		var name = content;
	}
	
	return name.replace(/\s/g, "");
}

//Returns "player" if the instruction represents an array of players, else the name of the instruction.
//Note: you must only pass the name of the instruction to this function.
function getPlayerVarName(content) {
	if (isSinglePlayerInstruction(content)) {
		return decompile(content);
	} else {
		return "player";
	}
}

//Checks if the (python) instruction represents only a player.
//Used to differenciate player and player[].
//Note: you must only pass the name to this function.
function isSinglePlayerInstruction(content) {
	
	content = topy(getName(content), valueKw);
	
	debug("Checking if '"+content+"' is a single player instruction");
	
	var playerInstructions = [
		"attacker",
		"getClosestPlayer",
		"eventPlayer",
		"getFarthestPlayer",
		"_firstOf",
		"_lastOf",
		"getPlayerCarryingFlag",
		"getPlayerClosestToReticle",
		"_randomValueInArray",
		"victim",
		"_currentArrayElement",
		"isDead",
		"isAlive",
		"isCommunicating",
		"isCommunicatingAny",
		"isCommunicatingAnyEmote",
		"isCommunicatingAnyVoiceline",
		"isCrouching",
		"isUsingAbility1",
		"isUsingAbility2",
		"isHoldingButton",
		"isFiringPrimary",
		"isFiringSecondary",
		"isInAir",
		"isOnGround",
		"isInSpawnRoom",
		"isMoving",
		"isOnObjective",
		"isOnWall",
		"isOnFire",
		"isStanding",
		"isUsingUltimate",
	];
	
	if (playerInstructions.indexOf(content) > -1) {
		return true;
	}
	return false;
}

//Same as isSinglePlayerInstruction, but for player arrays.
//However, note that these functions aren't mutually exclusive;
//if one of them returns false, the other one will not necessarily return true.
//This is because variables can hold a player and a player array, and we can't know which.
function isPlayerArrayInstruction(content) {
	
	content = topy(getName(content), valueKw);
	
	debug("Checking if '"+content+"' is a player array instruction");
	
	var playerArrayInstructions = [
		"getDeadPlayers",
		"getLivingPlayers",
		"getAllPlayers",
		"getAllLivingPlayers",
		"getAllDeadPlayers",
		"getPlayersNotOnObjective",
		"getPlayersOnObjective",
		"getPlayersInSlot",
		"getPlayersInViewAngle",
		"getPlayersOnHero",
		"getPlayersInRadius",
	];
	
	if (playerArrayInstructions.indexOf(content) > -1) {
		return true;
	}
	return false;
}

//Returns 4 spaces per tab level.
function tabLevel(nbTabs) {
	var result = "";
	for (var i = 0; i < nbTabs; i++) {
		result += "    ";
	}
	return result;
}


//Translates a keyword to the other language.
function translate(keyword, toWorkshop, keywordArray) {
	
	if (!toWorkshop) {
		keyword = keyword.toLowerCase();
		if (keywordArray !== stringKw) {
			keyword = keyword.replace(/\s/g, "");
		}
	}
	debug("Translating keyword '"+keyword+"'");
	debug(keywordArray === stringKw);
	
	//Check for current array element
	if (toWorkshop) {
		for (var i = 0; i < currentArrayElementNames.length; i++) {
			if (keyword === currentArrayElementNames[i]) {
				return translate("_currentArrayElement", true, valueFuncKw);
			}
		}
	}
	
	
	
	for (var i = 0; i < keywordArray.length; i++) {
				
		if (toWorkshop) {
			//for (var j = 0; j < keywordArray[i][0].length; j++) {
				if (keywordArray[i][0][0] === keyword) {
					return keywordArray[i][1][currentLanguage];
				}
			//}
		} else {
			for (var j = 0; j < keywordArray[i][1].length; j++) {
				if (keywordArray[i][1][j].toLowerCase() === keyword) {
					return keywordArray[i][0][0];
				}
			}
		}
		
	}
	
	//Check for numbers
	if (!isNaN(keyword)) {
		//Convert to int then to string to remove unnecessary 0s.
		keyword = Number(keyword).toString();
		return keyword;
	}
	
	error("No match found for keyword '"+keyword+"'");	
}

function topy(keyword, keywordArray) {
	return translate(keyword, false, keywordArray);
}
function tows(keyword, keywordArray) {
	
	//Check if a token was passed, or a string
	if (typeof keyword === "object") {
		currentLineNb = keyword.lineNb;
		currentColNb = keyword.colNb;
		return translate(keyword.text, true, keywordArray);
	} else {
		return translate(keyword, true, keywordArray);
	}
}

//Returns an array of workshop instructions (delimited by a semicolon).
function splitInstructions(content) {
	return splitStrOnDelimiter(content, [';']);
}

//Returns an array of arguments (delimited by a comma).
function getArgs(content) {
	return splitStrOnDelimiter(content, [',']);
}

//Returns an array of strings that are delimited by the given string(s).
//The delimiter is only taken into account if it is not within parentheses and not within a string.
//Example: "azer(1,2), reaz(',,,,')" will return ["azer(1,2)","reaz(',,,,')"] for a comma separator.
function splitStrOnDelimiter(content, delimiter) {
	
	content = content.trim();
	var bracketPos = getBracketPositions(content);
	var bracketPosCheckIndex = 0;
	var delimiterPos = [-delimiter.length];
	var currentPositionIsString = false;
	var currentStrDelimiter = "";
	
	for (var i = 0; i < content.length; i++) {
		//Check if the current index is in parentheses
		if (bracketPosCheckIndex < bracketPos.length && i >= bracketPos[bracketPosCheckIndex]) {
			i = bracketPos[bracketPosCheckIndex+1];
			bracketPosCheckIndex += 2;
			
		} else if (!currentPositionIsString && (content.charAt(i) == '"' || content.charAt(i) == '\'')) {
			currentPositionIsString = !currentPositionIsString;
			currentStrDelimiter = content.charAt(i);
		} else if (content.charAt(i) === currentStrDelimiter) {
			currentPositionIsString = !currentPositionIsString;
		} else if (content.charAt(i) == '\\') {
			i++;
		} else if (!currentPositionIsString && content.startsWith(delimiter, i)) {
			delimiterPos.push(i);
		}

	}
	
	delimiterPos.push(content.length);
	
	var result = [];
	for (var i = 0; i < delimiterPos.length-1; i++) {
		var currentStr = content.substring(delimiterPos[i]+delimiter.length, delimiterPos[i+1]);
		currentStr = currentStr.trim();
		if (currentStr.length > 0) {
			result.push(currentStr);
		}
	}
	
	return result;
}

//Same as splitStrOnDelimiter but for a token list.
//If getAllTokens = false, this will only split on the first occurrence of the token.
function splitTokens(tokens, str, getAllTokens=true, rtl=false) {
	
	var result = [];
	var bracketsLevel = 0;
	
	if (rtl) {
		var start = tokens.length-1;
		var end = -1;
		var step = -1;
		var latestDelimiterPos = tokens.length;
	} else {
		var start = 0;
		var end = tokens.length;
		var step = 1;
		var latestDelimiterPos = -1;
	}
	
	//debug("Splitting tokens '"+dispTokens(tokens)+"' on "+str);
	
	for (var i = start; i != end; i+=step) {
		if (tokens[i].text === '(' || tokens[i].text === '[' || tokens[i].text === '{') {
			bracketsLevel += step;
		} else if (tokens[i].text === ')' || tokens[i].text === ']' || tokens[i].text === '}') {
			bracketsLevel -= step;
		} else if (tokens[i].text === str && bracketsLevel === 0) {
			if (rtl) {
				result.push(tokens.slice(i+1, latestDelimiterPos));
			} else {
				result.push(tokens.slice(latestDelimiterPos+1, i));
			}
			latestDelimiterPos = i;
			if (!getAllTokens) {
				break;
			}
		}
	}
	
	if (bracketsLevel !== 0) {
		error("Lexer broke (bracket level not equal to 0)");
	}
	
	if (rtl) {
		result.push(tokens.slice(end+1, latestDelimiterPos));
	} else {
		result.push(tokens.slice(latestDelimiterPos+1, end));
	}
		
	if (result[0].length === 0 && result.length === 1) {
		return [];
	} else {
		return result;
	}
	
}


//This function returns the index of each first-level opening and closing brackets/parentheses.
//Example: the string "3*(4*(')'))+(4*5)" will return [2, 10, 12, 16].
function getBracketPositions(content, returnFirstPair=false) {
	var bracketsPos = []
	var bracketsLevel = 0;
	var currentPositionIsString = false;
	var currentStrDelimiter = "";
	for (var i = 0; i < content.length; i++) {
		if (!currentPositionIsString && startsWithParenthesis(content.substring(i))) {
			bracketsLevel++;
			if (bracketsLevel == 1) {
				bracketsPos.push(i);
			}
		} else if ((content.charAt(i) == ')' || content.charAt(i) == ']' || content.charAt(i) == '}') && !currentPositionIsString) {
			bracketsLevel--;
			if (bracketsLevel == 0) {
				bracketsPos.push(i);
				if (returnFirstPair) {
					break;
				}
			} else if (bracketsLevel < 0) {
				error("Brackets level below 0! (missing opening bracket)");
			}
		} else if (!currentPositionIsString && (content.charAt(i) == '"' || content.charAt(i) == '\'')) {
			currentPositionIsString = !currentPositionIsString;
			currentStrDelimiter = content.charAt(i);
		} else if (content.charAt(i) === currentStrDelimiter) {
			currentPositionIsString = !currentPositionIsString;
		} else if (content.charAt(i) == '\\') {
			i++;
		}
	}
	if (bracketsLevel > 0) {
		error("Brackets level above 0! (missing closing bracket)");
	}
	
	return bracketsPos;
}

//Same as getBracketPositions but for tokens.
function getTokenBracketPos(tokens, returnFirstPair=false) {
	var bracketsPos = []
	var bracketsLevel = 0;
	var currentPositionIsString = false;
	var currentStrDelimiter = "";
	for (var i = 0; i < tokens.length; i++) {
		if (tokens[i].text === '(' || tokens[i].text === '[' || tokens[i].text === '{') {
			bracketsLevel++;
			if (bracketsLevel == 1) {
				bracketsPos.push(i);
			}
		} else if (tokens[i].text === ')' || tokens[i].text === ']' || tokens[i].text === '}') {
			bracketsLevel--;
			if (bracketsLevel === 0) {
				bracketsPos.push(i);
				if (returnFirstPair) {
					break;
				}
			}
		} 
	}
	if (bracketsLevel > 0) {
		error("Brackets level above 0! (missing closing bracket)");
	}
	
	return bracketsPos;
}

//Returns true if the given string starts with a parenthesis (or a bracket/curly bracket).
function startsWithParenthesis(content) {
	if (content[0] == '(' || content[0] == '[' || content[0] == '{') {
		return true;
	}
	return false;
}

//Returns true if c is [A-Za-z\d_].
function isVarChar(c) {
	return c >= 'A' && c <= 'Z' || c >= 'a' && c <= 'z' || c >= '0' && c <= '9' || c === '_' || c === '@';
}

//Returns the indent, assuming 1 indent = 4 spaces.
function getIndent(content) {
	var indent = 0;
	var i = 0;
	while (content.startsWith("    ", i)) {
		indent++;
		i += 4;
	}
	return indent;
}

//Converts a token list, or a token object to string.
function dispTokens(content) {
	if (content instanceof Array) {
		var result = "";
		for (var i = 0; i < content.length; i++) {
			result += content[i].text;
			if (i < content.length-1) {
				result += " ";
			}
		}
		return result;
	} else if (typeof content === "string") {
		return content;
	} else if (typeof content === "object") {
		if (content.text === undefined) {
			error("Object is not a token or token list");
		} else {
			return content.text;
		}
	} else {
		error("Undefined content "+content);
	}
}

//Logging stuff
function error(str, token) {
	
	if (token !== undefined) {
		currentLineNb = token.lineNb;
		currentColNb = token.colNb;
	}
	
	//var error = "ERROR: ";
	var error = "";
	if (currentLineNb !== undefined && currentLineNb > 0) {
		error += "line "+currentLineNb+", col "+currentColNb+": ";
	}
	error += str;
	if (token !== undefined) {
		error += "'"+dispTokens(token)+"'";
	}
	
	throw new Error(error);
}

function debug(str, arg) {
	//return;
	console.log("DEBUG: "+str);
}

//ty stackoverflow
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}/* 
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

"use strict";
//OverPy Decompiler (Workshop -> OverPy)


/*var counter = 0;
var counter2 = 0;*/
/*for (var h = 0; h < testvalues.length; h++) {
	var isIn = false;
	for (var i = 0; i < valueKw.length; i++) {
		for (var j = 0; j < valueKw[i][1].length; j++) {
			if (valueKw[i][1][j].toLowerCase() === testvalues[h]["name"].replace(/\s/, "").toLowerCase()) {
				isIn = true;
			}
		}
	}
	if (isIn) {
		counter++;
	} else {
		counter2++;
	}
}*/
/*for (var h = 0; h < testactions.length; h++) {
	var isIn = false;
	for (var i = 0; i < actionKw.length; i++) {
		for (var j = 0; j < actionKw[i][1].length; j++) {
			if (actionKw[i][1][j].toLowerCase() === testactions[h]["name"].replace(/\s/, "").toLowerCase()) {
				isIn = true;
			}
		}
	}
	if (isIn) {
		counter++;
	} else {
		counter2++;
	}
}
console.log(counter);
console.log(counter2);*/

//console.log(decompileAllRules(decompileTest));

/*console.log(decompileAllRules(decompileTest, {
	"a":"currentSectionWalls",
	"b":"tpStarts",
	"c":"tpDests",
	"d":"deathplaneY",
	"e":"roundWinners",
	"f":"mapId",
	"g":"hasFirstInfectionPassed",
	"i":"sectionLoopIndex",
	"j":"level",
	"l":"lateTps",
	"m":"sectionRadiuses",
	"n":"currentSection",
	"o":"firstInfectionLoopIndex",
	"p":"matchTime",
	"q":"countdownProgress",
	"r":"roundProgress",
	"s":"sectionData",
	"t":"triggers",
	"w":"walls",
	"z":"zombieHero",
}, {
	b:"fastFireCountdown",
	c:"tempPos",
	f:"hasWonRound",
	j:"wallLoopIndex",
	l:"wasFirstZombieLastRound",
	z:"team",
}));*/

function decompileAllRules(content, globalVarNames={}, playerVarNames={}) {

	var result = "";
	
	//debug(globalVarNames);
	//debug(playerVarNames);
	
	if (Object.entries(globalVarNames).length !== 0) {
		result += "#Global variables\n\n";
		result += loadVariableNames(globalVarNames, globalVarKw);
		result += "\n\n";
	}
	if (Object.entries(playerVarNames).length !== 0) {
		result += "#Player variables\n\n";
		result += loadVariableNames(playerVarNames, playerVarKw);
		result += "\n\n";
	}

	var bracketPos = [-1].concat(getBracketPositions(content));
	
	//A rule looks like this:
	//rule(title) {...}
	//Therefore, each rule ends every 4th bracket position
	
	
	for (var i = 0; i < bracketPos.length-1; i += 4) {
	//for (var i = 0; i < 4; i += 4) {
		if (i >= bracketPos.length-1) break;
		result += decompileRule(content.substring(bracketPos[i]+1, bracketPos[i+4]+1));
	}
	
	resetVarNames(globalVarKw);
	resetVarNames(playerVarKw);
	
	return result;
	
}

function decompileRule(content) {
	
	//Reset rule-specific global variables
	decompilerGotos = [];
	nbTabs = 0;
	lastLoop = -1;
	
	//Check for potential error
	if (currentArrayElementNames.length != 0) {
		error("Current array element names weren't cleared");
	}
	
	var bracketPos = getBracketPositions(content);
	if (bracketPos.length != 4) {
		error("Invalid rule (mismatched brackets): has "+bracketPos.length+" top-level brackets, should be 4");
	}
	
	var ruleName = content.substring(bracketPos[0]+1, bracketPos[1]);
	
	debug("Decompiling rule "+ruleName);
	
	var result = "@Rule "+ruleName+"\n";
	
	var ruleContent = content.substring(bracketPos[2]+1, bracketPos[3]);
	
	var bracketPos2 = [-1].concat(getBracketPositions(ruleContent));
	
	var eventInst = [];
 	var conditions = "";
	var actions = "";
	
	for (var i = 0; i < bracketPos2.length-2; i += 2) {
		var fieldName = topy(ruleContent.substring(bracketPos2[i]+1, bracketPos2[i+1]), ruleKw);
		if (fieldName === "@Event") {
			eventInst = splitInstructions(ruleContent.substring(bracketPos2[i+1]+1, bracketPos2[i+2]));
		} else if (fieldName === "_conditions") {
			//conditions = splitInstructions(ruleContent.substring(bracketPos2[i+1]+1, bracketPos2[i+2]));
			conditions = "conditions {"+ruleContent.substring(bracketPos2[i+1]+1, bracketPos2[i+2])+"}";
		} else if (fieldName === "_actions") {
			//actions = splitInstructions(ruleContent.substring(bracketPos2[i+1]+1, bracketPos2[i+2]));
			actions = "actions {"+ruleContent.substring(bracketPos2[i+1]+1, bracketPos2[i+2])+"}";
		} else {
			error("Unknown field name "+fieldName+" in rule "+ruleName);
		}
	}
	
	//Parse events
	if (eventInst.length > 0) {
		result += "@Event "+topy(eventInst[0], eventKw)+"\n";
		if (eventInst.length > 1) {
			//There cannot be only 2 event instructions: it's either 1 (global) or 3 (every other event).
			if (topy(eventInst[1], eventKw) !== "all") {
				result += "@Team "+topy(eventInst[1], eventKw)+"\n";
			}
			
			//Parse the 3rd event instruction
			//Detect if it is a slot or hero
			var eventInst3 = topy(eventInst[2], eventKw.concat(heroKw))
			if (eventInst3 !== "all") {
				if (eventInst3.startsWith("slot")) {
					result += "@Slot "+eventInst3.replace("slot", "")+"\n";
				} else {
					//We assume it is a hero
					result += "@Hero "+eventInst3.substring("HERO.".length).toLowerCase() + "\n";
				}
			}
		}
	}
	
	//Parse conditions
	if (conditions !== "") {
		result += decompileConditions(conditions);
	}
		
	//Parse actions
	if (actions !== "") {
		result += decompileActions(actions);
	}
	return result+"\n\n";
}

function decompileConditions(content) {
	
	var conditions = splitInstructions(content.substring(content.indexOf("{")+1, content.lastIndexOf("}")));
	
	var result = "";
	result += "if ";
	var condStrs = [];
	for (var i = 0; i < conditions.length; i++) {
		
		var currentCond = decompileRuleCondition(conditions[i]);
		//Check for and-ing with true
		if (currentCond === "true") {
			continue;
		}
		
		if (operatorPrecedenceStack[0] < 2) {
			currentCond = "("+currentCond+")";
		}
		condStrs.push(currentCond);
	}
	var condStr = condStrs.join(" and ");
	
	//This happens if everything is true
	if (condStr === "") {
		condStr = "true";
	}
	result += condStr;
	
	result += ":\n"
	nbTabs = 1;
	
	return result;
}

function decompileActions(content) {
	
	var result = "";
	var actions = splitInstructions(content.substring(content.indexOf("{")+1, content.lastIndexOf("}")));
	
	//Detect the last loop to know where to place the "while"
	for (var i = 0; i < actions.length; i++) {
		if (topy(getName(actions[i]), actionKw).startsWith("_loop")) {
			//It is a loop; update the loop position
			lastLoop = i;
		}
	}
	
	//If a loop was detected, add the "do:" and increment the indentation level.
	if (lastLoop >= 0) {
		result += tabLevel(nbTabs)+"do:\n";
		nbTabs++;
	}
		
	for (var i = 0; i < actions.length; i++) {
		if (i == lastLoop) {
			nbTabs--;
		}
		result += tabLevel(nbTabs) + decompileAction(actions[i], i) + "\n";
	}

	//Add the remaining gotos (caused eg. by a skip 50 in a rule with 10 actions).
	for (var i = 0; i < decompilerGotos.length; i++) {
		if (decompilerGotos[i] > 0) {
			result += tabLevel(nbTabs)+"lbl_"+i+":\n";
		}
	}
	
	return result;
}

function decompileAction(content, actionNb) {
	
	var result = "";
	
	//Reset variable
	operatorPrecedenceStack = [];
	
	//Decrement each goto (for skips)
	for (var i = 0; i < decompilerGotos.length; i++) {
		decompilerGotos[i]--;
		//Check if the goto has reached its destination
		if (decompilerGotos[i] == 0) {
			result += "lbl_"+i+":\n"+tabLevel(nbTabs);
		}
	}
	
	if (actionNb == lastLoop) {
		result += decompile(content, actionKw, {"isLastLoop":true});
	} else {
		
		result += decompile(content, actionKw, 0, {"isLastLoop":false});
	}
	return result;
}

//This function only decompiles conditions that are in the "condition" section of a rule.
//This is needed to handle the binary operators.
function decompileRuleCondition(content) {
	
	debug("Decompiling condition '"+content+"'");
	
	//Reset variable
	operatorPrecedenceStack = [];
	var operators = ["==", "!=", "<=", ">=", "<", ">"];
	
	for (var i = 0; i < operators.length; i++) {
		var operands = splitStrOnDelimiter(content, operators[i]);
		if (operands.length == 2) {
			return decompileCondition(operands[0], operators[i], operands[1]);
		}
	}
	
	error("Could not decompile condition "+content);
	
}

//Decompiles conditions (whether rule conditions or compare() conditions).
//Used to optimise some stuff (eg: condition==true -> condition, condition==false -> not condition).

function decompileCondition(operand1, operator, operand2) {
	var result = "";
	var isOneOperandFalse = false;
	var operands = [operand1, operand2];
	operator = operator.trim();
	if (operator == "==") {
		//condition == true check
		for (var i = 0; i < operands.length; i++) {
			var translated = topy(getName(operands[i]), valueKw);
			if (translated === "true") {
				operands[i] = "";
			} else if (translated === "false") {
				operands[i] = "";
				isOneOperandFalse = true;
			}
		}
	}
	
	
	if (operands[0] !== "" && operands[1] !== "") {
		result = decompileOperator(operands[0], operator, operands[1])
	} else if (operands[0] !== "") {
		if (isOneOperandFalse) {
			result = decompileOperator(operands[0], "not", "");
		} else {
			result = decompile(operands[0]);
		}
	} else if (operands[1] !== "") {
		if (isOneOperandFalse) {
			result = decompileOperator(operands[1], "not", "");
		} else {
			result = decompile(operands[1]);
		}
	} else if (isOneOperandFalse) {
		result = "false";
	} else {
		result = "true";
	}
	
	
	return result;
}

//Main parser function for workshop -> overpy.
function decompile(content, keywordArray=valueKw, decompileArgs={}) {
	
	if (keywordArray === undefined) {
		error("KeywordArray is undefined");
	} else if (content === undefined) {
		error("Content is undefined");
	}
	
	debug("Decompiling '"+content+"'");
	var bracketPos = getBracketPositions(content);
	
	
	var hasArgs = false
	if (bracketPos.length == 2) {
		hasArgs = true;
	} else if (bracketPos.length != 0) {
		error("Mismatched top-level brackets in action "+content+": expected 0 or 2, found "+bracketPos.length)
	}
	
	//Check if there are empty parentheses
	if (bracketPos.length == 2 && content.substring(bracketPos[0]+1, bracketPos[1]).trim().length == 0) {
		hasArgs = false;
		content = content.substring(0, bracketPos[0]);
	}
		
	var name = "";
	if (bracketPos.length == 2) {
		name = content.substring(0, bracketPos[0]);
	} else {
		name = content;
	}
	name = topy(name.toLowerCase().replace(/\s/g, ""), keywordArray);
	
	if (name !== "_compare" && decompileArgs.invertCondition === true) {
		return parseOperator(content, "not", null);
	}
	
	var args = [];
	if (hasArgs) {
		var args = getArgs(content.substring(bracketPos[0]+1, bracketPos[1]));
	}
	debug("Arguments: "+args);
	var result = "";
	
	//Handle special functions that can't be directly translated
	//Special functions are sorted alphabetically.
	
	//Player functions can't be translated, but most of them are generic.
	//They begin by "_&".
	
	if (name.startsWith("_&")) {
		return decompileGenericPlayerFunction(name.substring(2), args, keywordArray === actionKw ? true : false);
	}
	
	//Functions beginning with "_!" have their arguments swapped (assuming there are only 2 arguments).
	if (name.startsWith("_!")) {
		if (args.length !== 2) {
			error("Argument length for swapped function must be 2");
		}
		return name.substring("_!".length)+"("+decompile(args[1])+", "+decompile(args[0])+")";
	}
	
	//Abort if
	if (name === "_abortIf") {
		result = "if " + decompile(args[0]) + ":\n";
		result += tabLevel(nbTabs+1) + "return";
		
		return result;
	}
	
	//Abort if condition is false/true
	if (name === "_abortIfConditionIsFalse" || name === "_abortIfConditionIsTrue") {
		result = "if ";
		if (name === "_abortIfConditionIsFalse") {
			result += "not ";
		}
		result += "RULE_CONDITION:\n";
		result += tabLevel(nbTabs+1) + "return";
		
		return result;
	}
	
	//Add
	if (name === "_add") {
		return decompileOperator(args[0], "+", args[1]);
	}
	
	//Is true for all
	if (name === "_all") {
		
		if (isPlayerArrayInstruction(args[0])) {
			var varName = "player";
		} else {
			var varName = "i";
		}
		
		debug("Pushing currentArrayElementName "+varName);
		currentArrayElementNames.push(varName);
		
		var result = "all(["+decompile(args[1])+" for "+varName+" in "+decompile(args[0])+"])";
		currentArrayElementNames.pop();
		return result;
	}
	
	//Is true for any
	if (name === "_any") {
		
		if (isPlayerArrayInstruction(args[0])) {
			var varName = "player";
		} else {
			var varName = "i";
		}
		
		debug("Pushing currentArrayElementName "+varName);
		currentArrayElementNames.push(varName);
		
		var result = "any(["+decompile(args[1])+" for "+varName+" in "+decompile(args[0])+"])";
		currentArrayElementNames.pop();
		return result;
	}
	
	//And
	if (name === "_and") {
		return decompileOperator(args[0], "and", args[1]);
	}
	
	//Append to array
	if (name === "_appendToArray") {
		
		//Check for optimization: [].append(123).append(456) -> [123, 456]
		//Only done if we append a literal number to a literal array.
		
		var decompiledArg0 = decompile(args[0]);
		var decompiledArg1 = decompile(args[1]);
		
		if (decompiledArg0.startsWith('[') && decompiledArg0.endsWith(']') && !isNaN(decompiledArg1)) {
			var result = decompiledArg0.substring(0, decompiledArg0.length-1);
			if (decompiledArg0 !== "[]") {
				result += ", ";
			}
			result += decompiledArg1+"]";
			return result;
		} else {
			return decompiledArg0+".append("+decompiledArg1+")";
		}
	}
	
	//Array contains
	if (name === "_arrayContains") {
		
		return decompile(args[1])+" in "+decompile(args[0]);
	}
	
	//Array slice
	if (name === "_arraySlice") {
		return decompile(args[0]) + ".slice(" + decompile(args[1]) + ", " + decompile(args[2])+")";
	}
	
	//Chase global variable at rate
	if (name === "_chaseGlobalVariableAtRate") {
		
		return "chase("+decompile(args[0], globalVarKw)+", "+decompile(args[1])+", rate="+decompile(args[2])+", "+decompile(args[3])+")";
	}
	
	//Chase global variable over time
	if (name === "_chaseGlobalVariableOverTime") {
		
		return "chase("+decompile(args[0], globalVarKw)+", "+decompile(args[1])+", duration="+decompile(args[2])+", "+decompile(args[3])+")";
	}
	
	//Chase player variable at rate
	if (name === "_chasePlayerVariableAtRate") {
		
		var result = decompilePlayerFunction("chase({player}.{arg0}, {arg1}, rate={arg2}, {arg3})", args[0], args.slice(1), true)
		
		return result;
	}
	
	//Chase player variable over time
	if (name === "_chasePlayerVariableOverTime") {
		
		var result = decompilePlayerFunction("chase({player}.{arg0}, {arg1}, duration={arg2}, {arg3})", args[0], args.slice(1), true)
		
		return result;
	}
		
	//Compare
	if (name === "_compare") {
		
		var op = args[1].trim();
		if (decompileArgs.invertCondition === true) {
			op = reverseOperator(op);
		}
		
		return decompileCondition(args[0], op, args[2]);
		//return "("+decompile(args[0]) + ") " + args[1].trim() + " (" + decompile(args[2])+")";
	}
	
	//Current array element
	if (name === "_currentArrayElement") {
		var currentArrayElementName = currentArrayElementNames[currentArrayElementNames.length-1];
		if (currentArrayElementName === undefined) {
			error("currentArrayElementName is undefined");
		}
		return currentArrayElementName;
	}
	
	//Divide
	if (name === "_divide") {
		return decompileOperator(args[0], "/", args[1]);
	}
	
	//Empty array
	if (name === "_emptyArray") {
		return "[]";
	}
	
	//Filtered array
	if (name === "_filteredArray") {
		
		if (isPlayerArrayInstruction(args[0])) {
			var varName = "player";
		} else {
			var varName = "i";
		}
		
		debug("Pushing currentArrayElementName "+varName);
		currentArrayElementNames.push(varName);
		
		var result = "["+varName+" for "+varName+" in "+decompile(args[0])+" if "+decompile(args[1])+"]";
		currentArrayElementNames.pop();
		return result;
	}
	
	//First of
	if (name === "_firstOf") {
		return decompile(args[0])+"[0]";
	}
	
	//Raycast hit normal
	if (name === "_getNormal") {
		return "raycast("+decompile(args[0])+", "+decompile(args[1])+", include="+decompile(args[2])+", exclude="+decompile(args[3])+", includePlayerObjects="+decompile(args[4])+").getNormal()";
	}
	
	//Raycast hit position
	if (name === "_getHitPosition") {
		return "raycast("+decompile(args[0])+", "+decompile(args[1])+", include="+decompile(args[2])+", exclude="+decompile(args[3])+", includePlayerObjects="+decompile(args[4])+").getHitPosition()";
	}
	
	//Raycast hit player
	if (name === "_getPlayerHit") {
		return "raycast("+decompile(args[0])+", "+decompile(args[1])+", include="+decompile(args[2])+", exclude="+decompile(args[3])+", includePlayerObjects="+decompile(args[4])+").getPlayerHit()";
	}
		
	//Global variable
	if (name === "_globalVar") {
		return decompile(args[0], globalVarKw);
	}
		
	//Hero
	if (name === "_hero") {
		return decompile(args[0], heroKw);
	}
	
	//Index of array value
	if (name === "_indexOfArrayValue") {
		return decompile(args[0])+".index("+decompile(args[1])+")";
	}
	
	//Is in line of sight
	if (name === "_isInLineOfSight") {
		return "raycast("+decompile(args[0])+", "+decompile(args[1])+", los="+decompile(args[2])+").hasLoS()";
	}
	
	//Last of
	if (name === "_lastOf") {
		return decompile(args[0])+"[-1]";
	}
			
	//Loop
	if (name === "_loop") {
		if (decompileArgs.isLastLoop) {
			return "while true";
		} else {
			return "continue";
		}
	}
	
	//Loop if
	if (name === "_loopIf") {
		if (decompileArgs.isLastLoop) {
			return "while "+decompile(args[0]);
		} else {
			var result = "if "+decompile(args[0])+":\n";
			result += tabLevel(nbTabs+1)+"continue";
			return result;
		}
	}
	
	//Loop if condition is false
	if (name === "_loopIfConditionIsFalse") {
		if (decompileArgs.isLastLoop) {
			return "while not RULE_CONDITION";
		} else {
			var result = "if not RULE_CONDITION:\n";
			result += tabLevel(nbTabs+1)+"continue";
			return result;
		}
	}
	
	//Loop if condition is true
	if (name === "_loopIfConditionIsTrue") {
		if (decompileArgs.isLastLoop) {
			return "while RULE_CONDITION";
		} else {
			var result = "if RULE_CONDITION:\n";
			result += tabLevel(nbTabs+1)+"continue";
			return result;
		}
	}
	
	//Modify global var
	if (name === "_modifyGlobalVar") {
		return decompileModifyVar(decompile(args[0], globalVarKw), args[1], decompile(args[2]));
	}
	
	//Modify player var
	if (name === "_modifyPlayerVar") {
		
		var playerVarName = getPlayerVarName(args[0]);
		var result = decompileModifyVar(playerVarName+"."+decompile(args[1], playerVarKw), args[2], decompile(args[3]))
		
		return decompilePlayerFunction(result, args[0], []);
	}
	
	//Modulo
	if (name === "_modulo") {
		return decompileOperator(args[0], "%", args[1]);
	}
	
	//Multiply
	if (name === "_multiply") {
		return decompileOperator(args[0], "*", args[1]);
	}
	
	//Or
	if (name === "_or") {
		return decompileOperator(args[0], "or", args[1]);
	}
	
	//Player variable
	if (name === "_playerVar") {
		if (isSinglePlayerInstruction(args[0])) {
			return decompile(args[0])+"."+decompile(args[1], playerVarKw);
		} else {
			if (isInNormalForLoop) {
				return "[player2."+decompile(args[1], playerVarKw)+" for player2 in "+decompile(args[0])+"]";
			} else {
				return "[player."+decompile(args[1], playerVarKw)+" for player in "+decompile(args[0])+"]";
			}
		}
	}
	
	//Raise to power
	if (name === "_raiseToPower") {
		return decompileOperator(args[0], "**", args[1]);
	}
	
	//Remove from array
	if (name === "_removeFromArray") {
		return decompile(args[0])+".exclude("+decompile(args[1])+")";
	}
	
	
	//Round
	if (name === "_round") {
		var roundType = topy(args[1], roundKw);
		if (roundType === "_roundUp") {
			return "ceil("+decompile(args[0])+")";
		} else if (roundType === "_roundDown") {
			return "floor("+decompile(args[0])+")";
		} else if (roundType === "_roundToNearest") {
			return "round("+decompile(args[0])+")";
		} else {
			error("Unknown round type "+roundType);
		}
	}
	
	//Set global var
	if (name === "_setGlobalVar") {
		return decompile(args[0], globalVarKw)+" = "+decompile(args[1]);
	}
	
	//Set global var at index
	if (name === "_setGlobalVarAtIndex") {
		return decompile(args[0], globalVarKw)+"["+decompile(args[1])+"] = "+decompile(args[2]);
	}
	
	//Set player var
	if (name === "_setPlayerVar") {
		return decompilePlayerFunction("{player}.{arg0} = {arg1}", args[0], args.slice(1), true);
	}
	
	//Set player var at index
	if (name === "_setPlayerVarAtIndex") {
		return decompilePlayerFunction("{player}.{arg0}[{arg1}] = {arg2}", args[0], args.slice(1), true);
	}
	
	//Stop chasing player variable
	if (name === "_stopChasingGlobalVariable") {
		return "stopChasingVariable("+args[0]+")";
	}
	
	//Stop chasing player variable
	if (name === "_stopChasingPlayerVariable") {
		return decompilePlayerFunction("stopChasingVariable({player}.{args})", args[0], args.slice(1));
	}
					
	//Subtract
	if (name === "_subtract") {
		return decompileOperator(args[0], "-", args[1]);
	}
	
	//Skip
	if (name === "_skip") {
		//Check if the number of skips is hardcoded
		if (!isNaN(args[0].trim())) {
			var gotoStr = "lbl_"+decompilerGotos.length;
			//Init the goto countdown
			decompilerGotos.push(parseInt(args[0])+1);
		} else {
			var gotoStr = "loc + "+decompile(args[0]);
		}
		
		return "goto "+gotoStr;
	}
	
	//Skip if
	if (name === "_skipIf") {
		result = "if " + decompile(args[0]) + ":\n";
		
		//Check if the number of skips is hardcoded
		if (!isNaN(args[1].trim())) {
			var gotoStr = "lbl_"+decompilerGotos.length;
			//Init the goto countdown
			decompilerGotos.push(parseInt(args[1])+1);
		} else {
			var gotoStr = "loc + "+decompile(args[1]);
		}
		
		result += tabLevel(nbTabs+1) + "goto "+gotoStr;
		
		return result;
	}
	
	//Sorted array
	if (name === "_sortedArray") {
		
		if (isPlayerArrayInstruction(args[0])) {
			var varName = "player";
		} else {
			var varName = "i";
		}
		
		debug("Pushing currentArrayElementName "+varName);
		currentArrayElementNames.push(varName);
		
		var result = "sorted("+decompile(args[0]);
		//If key == current array element, do not include it
		if (topy(getName(args[1]).trim(), valueKw) !== "_currentArrayElement") {
			result += ", key=lambda "+varName+": "+decompile(args[1]);
		}
		result += ")";
		currentArrayElementNames.pop();
		return result;
	}
	
	//String
	if (name === "_string") {
		
		//Blizzard likes making parsing difficult apparently,
		//cause the "reevaluation on string" used with hud is the same as the "string" function.
		
		if (args.length == 0) {
			return "Reeval.STRING";
		}
				
		var [str, format] = decompileString(args[0], args[1], args[2], args[3], decompileArgs.strDepth);
				
		if (decompileArgs.strDepth !== 0 && decompileArgs.strDepth !== undefined) {
			return [str, format];
		}
		
		result = '"'+str+'"';
		if (format.length > 0) {
			result += '.format(' + format.join(", ") + ")";
		}
		return result;
	}
				
	//Value in array
	if (name === "_valueInArray") {
		return decompile(args[0])+"["+decompile(args[1])+"]";
	}
	
	//Wait
	if (name === "_wait") {
		var arg2 = decompile(args[1]);
		if (arg2 === "Wait.IGNORE_CONDITION") {
			return "wait("+decompile(args[0])+")";
		}
		else {
			return "wait("+decompile(args[0])+", behavior="+arg2+")";
		}
	}
	
	//X/Y/Z component of
	if (name === "_xComponentOf") {
		return decompile(args[0])+".x";
	}
	if (name === "_yComponentOf") {
		return decompile(args[0])+".y";
	}
	if (name === "_zComponentOf") {
		return decompile(args[0])+".z";
	}
	
	if (name.startsWith('_')) {
		error("Unhandled special function "+name);
	}
	
	//Default case (not a special function).
	result = name;
	if (args.length > 0) {
		result += "("
		for (var i = 0; i < args.length; i++) {
			result += decompile(args[i]);
			if (i < args.length-1) {
				result += ", ";
			}
		}
		result += ")";
	}
	
	return result;
	
}

function decompileString(content, arg1, arg2, arg3, strDepth) {
		
	var result = content;
	var format = [];
	var args = [arg1, arg2, arg3];
	
	var nbArgs = 0;
	if (content.indexOf("{0}") > -1) nbArgs++;
	if (content.indexOf("{1}") > -1) nbArgs++;
	if (content.indexOf("{2}") > -1) nbArgs++;
	
	//debug("Parsing string '"+content+"' with nbargs = "+nbArgs);
	
	//Remove additional quotes
	if (result.startsWith('"') && result.endsWith('"')) {
		result = topy(result.substring(1, result.length-1), stringKw);
	}
	
	for (var i = 0; i < nbArgs; i++) {
		
		//Check if the string result must be put in the format array
		var isInFormat = true;
		
		var decompiledArg = decompile(args[i], valueKw, {"strDepth":1});
		
		//Skip nulls
		/*if (decompiledArg === "null") {
			continue;
		}*/
		
		if (decompiledArg.constructor !== Array) {
			decompiledArg = [decompiledArg];
		}
		
		//If the decompile function returned 2 arguments, the argument is a string
		if (decompiledArg.length > 1) {
			isInFormat = false;
			format = format.concat(decompiledArg[1]);
			
		//Else, check if the argument is a number
		} else if (!isNaN(decompiledArg[0])) {
			isInFormat = false;
			
		//Else, check if the argument is in the list of string keywords
		} else if (stringKw.indexOf(decompiledArg[0]) > -1) {
			isInFormat = false;
		}
		
		if (isInFormat) {
			format = format.concat(decompiledArg);
			result = result.replace("\{"+i+"\}", "{}");
		} else {
			//Remove the "Hero." prefix for heroes
			if (decompiledArg[0].startsWith("Hero.")) {
				decompiledArg[0] = decompiledArg[0].replace("Hero.","").toLowerCase();
				decompiledArg[0] = decompiledArg[0][0].toUpperCase() + decompiledArg[0].substring(1);
			}
			result = result.replace("\{"+i+"\}", decompiledArg[0]);
		}
	}
		
	
	debug("Format = "+format+", arg = "+decompiledArg);
	return [result, format];
	
}

//Function for the player functions, eg set projectile speed, has status, etc.
//There were so many of them, it was polluting the special functions table.
function decompileGenericPlayerFunction(name, args, isAction) {
	if (isAction === undefined) {
		error("isAction is undefined");
	}
	return decompilePlayerFunction("{player}."+name+"({args})", args[0], args.slice(1), false, isAction);
}

//Automatically generates a for loop for player function, if that player function takes an array as argument.
//The content is a python translation and must contain {player} and {args} to replace strings by the args.
//If separateArgs = true, {arg0}, {arg1} etc must be provided instead of {args}.
function decompilePlayerFunction(content, player, args, separateArgs=false, isAction=true) {
	
	var result = "";
	var hasNormalForLoopBeenSetInThisFunction = false;
	
	
	if (isSinglePlayerInstruction(player)) {
		result += content.replace("\{player\}", decompile(player))
		
	} else {
		if (isAction) {
			result += "for player in "+decompile(player)+":\n";
			result += tabLevel(nbTabs+1)+content.replace("\{player\}", "player")
			isInNormalForLoop = true;
			hasNormalForLoopBeenSetInThisFunction = true;
		} else {
			if (isInNormalForLoop) {
				result += "["+content.replace("\{player\}", "player2")+" for player2 in "+decompile(player)+"]";
			} else if (currentArrayElementNames.indexOf("player") > -1) {
				result += "["+content.replace("\{player\}", "player3")+" for player3 in "+decompile(player)+"]";
			} else {
				result += "["+content.replace("\{player\}", "player")+" for player in "+decompile(player)+"]";
			}
		}
	}
	
	
	//Parse arguments
	if (!separateArgs) {
		var argsStr = "";
		for (var i = 0; i < args.length; i++) {
			if (args[i].length === 1) {
				argsStr += decompile(args[i], playerVarKw);
			} else {
				argsStr += decompile(args[i]);
			}
			if (i < args.length-1) {
				argsStr += ", ";
			}
		}
		result = result.replace("\{args\}", argsStr)
	} else {
		for (var i = 0; i < args.length; i++) {
			if (args[i].length === 1) {
				result = result.replace("\{arg"+i+"\}", decompile(args[i], playerVarKw))
			} else {
				result = result.replace("\{arg"+i+"\}", decompile(args[i]))
			}
		}
	}
	if (hasNormalForLoopBeenSetInThisFunction) {
		isInNormalForLoop = false;
	}
	return result;
}

//Function used for "modify player variable" and "modify global variable".
//Note: arguments passed to this function must already be decompiled.
function decompileModifyVar(variable, operation, value) {
	operation = topy(operation, operationKw);
	if (operation === "_appendToArray") {
		return variable+".append("+value+")";
	} else if (operation === "_add") {
		//Handle special "++" case
		if (!isNaN(value) && parseInt(value) == 1) {
			return variable+"++";
		} else {
			return variable+" += "+value;
		}
	} else if (operation === "_subtract") {
		//Handle special "--" case
		if (!isNaN(value) && parseInt(value) == 1) {
			return variable+"--";
		} else {
			return variable+" -= "+value;
		}
	} else if (operation === "_multiply") {
		return variable+" *= "+value;
	} else if (operation === "_divide") {
		return variable+" /= "+value;
	} else if (operation === "_modulo") {
		return variable+" %= "+value;
	} else if (operation === "_raiseToPower") {
		return variable+" **= "+value;
	} else if (operation === "_min") {
		return variable+" min= "+value;
	} else if (operation === "_max") {
		return variable+" max= "+value;
	} else if (operation === "_removeFromArrayByIndex") {
		return "del "+variable+"["+value+"]";
	} else if (operation === "_removeFromArrayByValue") {
		return variable+".remove("+value+")";
	} else {
		error("Unhandled operation "+operation);
	}
}

//Function to handle operators and check whether any of the operands need parentheses.
//Eg: Decompiling Multiply(Add(1,2), 3) would produce "(1+2)*3". As one operand of the multiply
//function has another operand with lower precedence, it needs parentheses.
function decompileOperator(operand1, operator, operand2) {
	

	
	operatorPrecedenceStack.push(operatorPrecedence[operator]);
	var currentPrecedenceIndex = operatorPrecedenceStack.length-1;
	debug("precedence stack = "+operatorPrecedenceStack);
	
	var operands = [operand1];
	if (operator !== "not") {
		operands.push(operand2);
	}
	
	for (var h = 0; h < operands.length; h++) {
		var operandDecompiled = decompile(operands[h]);
	
		var currentPrecedence = operatorPrecedence[operator];
		var needsParentheses = false;
		
		for (var i = currentPrecedenceIndex+1; i < operatorPrecedenceStack.length; i++) {
			if (operatorPrecedenceStack[i] < currentPrecedence) {
				needsParentheses = true;
				operatorPrecedenceStack[currentPrecedenceIndex] = operatorPrecedenceStack[i];
			}
		}
		operatorPrecedenceStack = operatorPrecedenceStack.slice(0, currentPrecedenceIndex+1);
		if (needsParentheses) {
			operandDecompiled = "("+operandDecompiled+")";
		}
		operands[h] = operandDecompiled;
	}
	
	
	
	if (operator === "not") {
		return "not "+operands[0];
	} else {
		return operands[0] + " "+operator+" "+operands[1];
	}
	
}


module.exports = {
	decompileAllRules: decompileAllRules,
	decompileActions: decompileActions,
	decompileConditions: decompileConditions,
};

