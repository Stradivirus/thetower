export const DATA = {
  CARDS: {
    "Damage": { name: "Damage", desc: "Increases the card's stat multiplier" },
    "Attack Speed": { name: "Attack Speed", desc: "Increases the card's stat multiplier" },
    "Health": { name: "Health", desc: "Increases the card's stat multiplier" },
    "Health Regen": { name: "Health Regen", desc: "Increases the card's stat multiplier" },
    "Range": { name: "Range", desc: "Adds an additional multiplier to increase Damage / Meter" },
    "Cash": { name: "Cash", desc: "Adds a chance for elites to drop Reroll Dice" },
    "Coins": { name: "Coins", desc: "Increases the card's stat multiplier" },
    "Slow Aura": { name: "Slow Aura", desc: "Adds an additional affect to slow enemies attack speed" },
    "Critical Chance": { name: "Critical Chance", desc: "Adds an additional bonus to increase Crit Chance, Super Crit Chance, and Super Crit Factor" },
    "Enemy Balance": { name: "Enemy Balance", desc: "Adds a chance to double spawn elites" },
    "Extra Defense": { name: "Extra Defense", desc: "Increases the card's stat multiplier" },
    "Fortress": { name: "Fortress", desc: "Reduces Wall rebuild time" },
    "Free Upgrades": { name: "Free Upgrades", desc: "Adds a number of locked stats that are not impacted by Free Upgrades. This is set before the run starts, and cannot be changed mid run" },
    "Extra Orb": { name: "Extra Orb", desc: "Adds a coin bonus to enemies hit by orbs" },
    "Plasma Cannon": { name: "Plasma Cannon", desc: "Plasma Cannon fires at elite enemies for reduced damage" },
    "Critical Coin": { name: "Critical Coin", desc: "Adds a chance to drop two coins instead of one" },
    "Wave Skip": { name: "Wave Skip", desc: "Adds a distinct chance to double wave skip. This chance can be stacked with other skips" },
    "Intro Sprint": { name: "Intro Sprint", desc: "Dramatically increase how many waves intro sprint stays active" },
    "Land Mine Stun": { name: "Land Mine Stun", desc: "Unlocks Flashbang which causes enemies stunned by a Land Mine to have a chance to miss their attacks" },
    "Recovery Package Chance": { name: "Recovery Package Chance", desc: "Unlock Care Package which gives packages a chance to deliver a common module" },
    "Death Ray": { name: "Death Ray", desc: "Allows Death Ray to partially pierce a protector's shields" },
    "Energy Net": { name: "Energy Net", desc: "Adds a damage multiplier to enemies while they are trapped by the net and lingers for 10 seconds after" },
    "Super Tower": { name: "Super Tower", desc: "Causes 35% of cards multiplier effect to increase all Ultimate Weapon damage and decreases Super Tower cooldown" },
    "Second Wind": { name: "Second Wind", desc: "Unlocks a lingering health regen buff when activated which lasts for 400 waves" },
    "Demon Mode": { name: "Demon Mode", desc: "Unlocks a lingering damage buff when activated which lasts for 300 waves" },
    "Energy Shield": { name: "Energy Shield", desc: "Energy shield activates a blast that repels all enemies back by a percent of tower max range and destroys all enemy projectiles. The charge times of Rays are also reset" },
    "Wave Accelerator": { name: "Wave Accelerator", desc: "Increases the rate at which spawn rates accelerate causing more enemies to spawn in earlier waves" },
    "Berserker": { name: "Berserker", desc: "Increases damage cap to x500 for a duration when Death Defy is activated" },
    "Ultimate Crit": { name: "Ultimate Crit", desc: "Increases the card's stat multiplier" },
    "Nuke": { name: "Nuke", desc: "Unlocks a lingering attack speed slow which lasts for 300 waves after the nuke" },
    "Area of Effect": { name: "Area of Effect", desc: "Increases the range of all damage area of effects" }
  },

  MODULES: {
    cannon: {
      "아스트랄 구조": { name: "Astral Deliverance", desc: "Bounce Shot's range is increased by 3% of the Tower's total range. Each bounce increases the projectile's damage by 20/40/60/80%" },
      "절멸자": { name: "Being Annihilator", desc: "When you super crit, your next 3/4/5/6 are guaranteed super crit" },
      "사형 선고": { name: "Death Penalty", desc: "Chance of 5/8/11/15% to mark an enemy for death when it spawns, causing the first hit to destroy it" },
      "혼란 도래자": { name: "Havoc Bringer", desc: "10/13/15/20% chance for Rend Armor to instantly go to max" },
      "축소 광선": { name: "Shrink Ray", desc: "Attacks have a 1% chance to apply a non-stacking effect that decreases the enemy's mass by 10/20/30/40%" },
      "증폭 공격": { name: "Amplifying Strike", desc: "Killing a boss or elite enemy increases Tower damage by 5x for 5/11/18/26 seconds" }
    },
    armor: {
      "큐브 방지 포털": { name: "Anti-Cube Portal", desc: "Enemies take x10/15/20/25 damage for 7s after they are hit by a shockwave" },
      "음성 질량 프로젝터": { name: "Negative Mass Projector", desc: "If an Orb doesn't kill the enemy it will apply a stacking debuff, reducing its damage and speed by 1/1.5/2/2.5% per hit, to a max reduction of 50%" },
      "웜홀 재지향기": { name: "Wormhole Redirector", desc: "Health Regen can heal up to 25/50/75/100% of Package Max Recovery" },
      "공간 변위기": { name: "Space Displacer", desc: "Landmines have a 15/20/25/30% chance to spawn as an Inner Land Mine (20 max) instead of a normal mine. These mines autonomously move and organize around the tower" },
      "날카로운 용기": { name: "Sharp Fortitude", desc: "Increase the wall's health and regen by x1.25/1.5/2/2.5. Enemies take +1% increased damage for each subsequent hit on Wall Thorns" },
      "궤도 증강": { name: "Orbital Augment", desc: "Adds 2/4/6/8 orbiting Electrons around the tower. Each Electron deals damage equal to 15% of the enemy's remaining health (quarter effective against Bosses and Fleets)" }
    },
    generator: {
      "특이성 하네스": { name: "Singularity Harness", desc: "Increases the range of each bot by +5/8/11/15m. Enemies hit by the Flame bot receive double damage" },
      "은하 압축기": { name: "Galaxy Compressor", desc: "Collecting a recovery package reduces the cooldown of all Ultimate Weapons by 10/13/17/20s" },
      "펄서 수확기": { name: "Pulsar Harvester", desc: "Each time a projectile hits an enemy, there is a 1/1.5/2/2.5% chance that it will reduce the enemy's Health and Attack Level by 1" },
      "블랙홀 소화기": { name: "Black Hole Digestor", desc: "Temporarily get 3/5/7/10% extra Coins / Kill Bonus for each free upgrade you got on the current wave. Free Upgrades can not increase Tower Range" },
      "프로젝트 자금": { name: "Project Funding", desc: "Tower damage is multiplied by 12.5/25/50/100% of the number of digits in your current cash" },
      "회복 보너스": { name: "Restorative Bonus", desc: "Packages grant a 50% attack speed boost for 15/20/25/30s, decaying for 60 seconds" }
    },
    core: {
      "Om 칩": { name: "Om Chip", desc: "Spotlight will rotate to focus a boss. Bosses reflect the light around it to nearby enemies, increasing by x2/4/7/15 the damage they receive" },
      "하모니 도체": { name: "Harmony Conductor", desc: "15/20/25/30% chance of poisoned enemies to miss attack. Boss chance is halved" },
      "차원 코어": { name: "Dimension Core", desc: "Chain Lightning has 60% chance of hitting the initial target. Shock chance and multiplier is doubled. If the shock is applied to the same enemy the shock multiplier will add up to a max stack of 5/10/15/20" },
      "멀티버스 넥서스": { name: "Multiverse Nexus", desc: "Death Wave, Golden Tower and Black Hole will always activate at the same time, but the cooldown will be the average of those +20/+10/+1/-10s" },
      "자석 후크": { name: "Magnetic Hook", desc: "1/2/3/4 Inner Land Mines are fired at Bosses as they enter Tower range. 25% of Elites have Inner Land Mines fired at them as they enter Tower range" },
      "원시 붕괴": { name: "Primordial Collapse", desc: "Spawns one additional Black Hole. Damage from enemies within a Black Hole is decreased by 50/55/65/80%" }
    }
  },

  UW_PLUS: {
    death_wave: {
      kill_wall: { name: "Kill Wall", desc: "Each Effect Wave hit amplifies the Death Wave damage store by 3 (additively)" }
    },
    black_hole: {
      consume: { name: "Consume", desc: "Each Black Hole deals 5% the current wave HP to every enemy affected at the end of its activation" }
    },
    golden_tower: {
      golden_combo: { name: "Golden Combo", desc: "While Golden Tower is active a combo counter will be visible, each enemy kill adds +1. When Golden Tower finishes you receive extra cash and coins of 0.03% per combo" }
    },
    smart_missiles: {
      cover_fire: { name: "Cover Fire", desc: "Launch one additional missile every 13 seconds" }
    },
    chrono_field: {
      chrono_loop: { name: "Chrono Loop", desc: "Enemies affected by Chrono Field spiral towards the tower with a rotation rate of 0.1" }
    },
    poison_swamp: {
      death_creep: { name: "Death Creep", desc: "Every time poison ticks, the damage is increased by 120% of poison swamps base damage" }
    },
    inner_land_mines: {
      charge_mines: { name: "Charge Mines", desc: "The Damage of Inner Land Mines charge up the longer they're alive, increasing by x0.50 per second" }
    },
    chain_lightning: {
      smite: { name: "Smite", desc: "Every Chain Lightning Hit has a {Chain Lightning Chance}% chance to do extra damage equal to 0.05% the current wave HP (Max hits: 100/enemy)" }
    },
    spotlight: {
      light_range: { name: "Light Range", desc: "Spotlight damage bonus is boosted by 0.01x your damage/meter (Note: this is a separate multiplier based on enemy distance)" }
    }
  }
};