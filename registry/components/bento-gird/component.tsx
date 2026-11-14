"use client";

import React, { useId } from "react";
import { cn } from "@/lib/utils";

export interface TrainerItem {
  /** Unique identifier for the trainer */
  id: string;
  /** Accessible name for alt text */
  name: string;
  /** Portrait image URL or data URI */
  avatarUrl: string;
}

export interface MonthlyStatItem {
  /** Short month label (e.g. "JAN") */
  month: string;
  /** Bar height / metric value */
  value: number;
  /** Highlights the active bar with the bright neon lime gradient */
  highlighted?: boolean;
}

export interface FitnessBentoGridProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Hero metric value displayed in the top-right chart card */
  metricHeadline?: string;
  /** Label for the top-right activity filter button */
  activityFilterLabel?: string;
  /** Label for the top-right users pill */
  usersBadgeLabel?: string;
  /** Label for the leaderboard stats timeframe button */
  statsFilterLabel?: string;
  /** Monthly bar chart items */
  monthlyStats?: MonthlyStatItem[];
  /** Trainer portraits displayed in the bottom-right card */
  trainers?: TrainerItem[];
  /** Optional click handler for the Activity filter button */
  onActivityFilterClick?: () => void;
  /** Optional click handler for the Stats timeframe filter button */
  onStatsFilterClick?: () => void;
  /** Optional additional classes for the outer wrapper */
  className?: string;
}

const DEFAULT_MONTHLY_STATS: MonthlyStatItem[] = [
  { month: "JAN", value: 77 },
  { month: "FEB", value: 115, highlighted: true },
  { month: "MAR", value: 77 },
  { month: "APR", value: 65 },
  { month: "MAY", value: 17 },
  { month: "JUN", value: 90 },
  { month: "JUL", value: 65 },
];

const DEFAULT_TRAINERS: TrainerItem[] = [
  {
    id: "trainer-1",
    name: "Trainer 1",
    avatarUrl:
      "data:image/webp;base64,UklGRiAEAABXRUJQVlA4IBQEAAAQEgCdASoyADQAPlEkjkQjoiGWDq00OAUEtIAJ7X+x+EvhI8se1PIDZT/oeGvau/xu+agA3T/rdrUB1v/L8jf1X7CH6zkgP6th7hnzmspPASIWIfNasg2MG6duKaGcQHyA1cquETf6SjPDVpwpCjxeuDRdIcfxcMswAtR5O0KESDTgI4do3Q1/gQm6fySa52T8vQy/9+U5AAAA/v635LH1vPZEY0fyJx/V2f+MBsOdGBYROyirIINsLF55sMjduNb4Cdjj2+URJmSjiXykqC7TPd/AOjonvf2zqAq1DpmsGyNS1T0+xRGSp7To7if/CUZT3QuIf/ruKV+sr0GRLeLxN9GU+DPdxwl4JfHCEvlwvvXEcTMX1fv12cO7Se5yQEtZEa+dZ79e3l2nX3iX/assU3E/GiBlY0CF697D5bacCICgJx1hKXoUxqHuFdE0556IJEbbkEYj7H/zWcIY1Zq9DU0o53/pEDeRk8H6st0LfjV0MTfgrQCRb80wOBE4R0kiMAA4UA/g3tbPwRI22J3J8G1OwRXnj+5fV6XPwJ3Q/7/+Zv/jF/6wrhwzHBj0c2tRD5oIrwc7Ofdhsp3QNourJbA2oTSawe2rKX/GY6gKTI3TYsdxLTsa7zE9l1ZMYWcGbmxPAfGn8TEcxIvr8VrHUJB+XE9K6NXi3nD5SDCRK0zXXrYDK8n+tW5/oKS/u97mM98vuYWnHNDzdXPmUvTfl7KEM6haFbluRYU+dbyLfHlJg192pLspbs1sujNtlx8NpimFFqiXWC/lTnpd0uifhLLIW9S/3T3aDLAz8Xb6ioA9w5Os38Oe530gt9UuqpNdupp+V5+kzTk9ZIzsj2ZPEoA4ea6rhJKjtl4Ev7X9f58Dyme/IeLWWAJs7WEoipWl0VgEXKPCMdhe0x3SrjuReoBupO1l10ECJqVivYKXrN/vpfJjUVJbTih+kRR0LRGgvzweJ0Chk9QR2I+nJMz+JxuGl7nYxYd1C4JRmfyLX9hPyLfe/7Rc8Fupv6lip8h6wE7tOdQFzdwBd1Ps0OcZvn0YotZjAxuLrEMQTsGllEicYMTqOPFZg188Lb/Vt5PEee5ojZSKGHiLqTzNs5gO15tKbtXApkYNch9hJG76tPjvXEy6M4T8SGDzoQ3wRNQ7igntazhuYND5mLxC7whirgXsoTj+36DX/uo+5z1iyp25V138TkKTB4+mzw3g0C/7eCXG3qrMRGO7/SYv3ry6kuj7NuaU3U7Q/V633OwH1upE5zs4aBs+GB0wtaAoNg0FE4+S7R80//zIWM1VUD3JH3dmKXe0cKKZ4ACcVXIaKseFsfP3CfqfpLxOroCOwmKd/Yf5CoXE9mB5723C9vYZI9Fc5OUAjz2mxcTfXX23aSAAAAA=",
  },
  {
    id: "trainer-2",
    name: "Trainer 2",
    avatarUrl:
      "data:image/webp;base64,UklGRgIEAABXRUJQVlA4IPYDAADQEgCdASozADQAPlEijkSjoiEWDVTMOAUEtIAJ8W+0dIn589qt0Zvk/yH9Qz1/9+/LLgmMffqxb69ADxP9F31N7BH6zf7z8xws/9OQQW7ydX0i1CYwaNWZo6zd3swX2aFxjZIiGF3lXDdnp+CYA/mGa2qC8f/AgHgtwikHLpq5vUCGghSPOBNMShfOJG8pbCCkMoIUn1ths9sGLJflxgAA/v5z8FJ5nrtdA4osS0+cOmX59E1MQsAP194niESqDgB62daIKc+7dfk23DIe2LurEqpgSmeB4b+e8l0r5SA7n02i5lB2xxGIty1APmwpfka4j39Vp6WfKKdF0S/9EBl+PuVXwKebfsg/8e9BNTv91L2vDKs/6/5aNFqe57hGnmOjYRhCbQNYT7DzkXVqr3/ETl1rg427zj7KCixtk0a2RCybHKySvsBxHWVhsiCSzgWX9uQ2lCI1SXBhJ26JTmUmrF9vykUMqw9z48t+cSdP9DeSw7MCgD8yemP78USJmgaTFWKh83aM3UHyKuatqLdHloapxR6k++aSZMd112K++y2fkMf3TPueRK77Com0ldx4k8Irbw9e12zpLFbqmdrz/rf+oZoXU/1d5oa5h1h7w3u/RrGuz78uVufLAJBDXb00anMzylk/kTdzRFz46k1R+ogmqucNqnvuB2esxGnfHvQEgi8eNDogjh99crPtWVzz1fkgicSnZB8iJ+Zv8wKvm14T5AA6kEsnzDz7rLLe4NHmM2qcmG2fLpA433Jitnmxc6gU0ZnR6rQrGuf4YOZd5uhEWAkehh8aIRKCv6QRBn/TmtvyIEblGgcOmTJ4Oox+5+qnqtwE2I2AwlA/c+iWD2zfCdL7T8KPUhIzkgLAwXDEeGd6BFOcOO3kKt4W0Qf3xsyBpgdwqNIjcKmJ32iY7aNf5I9mYDll1GOZJt4MxeeVRm3nWuPpBxBTqcAPZfBPgqjM176JlA0P3rnIE70+GdoNz1mu+fg06SUgrLOpnnrFDNgnRtPXJUWDua3wMll1NLH4dgL0k+JSe3Kc5vT9jki0wapQrqF1XkUqJIH82bTzlMNVsMIewI15/0n6u2YTKLb1n/WI9msv6iTk/4+p/xQ1hCmy84r1nt1rA8EaehDMlLvnlDy/F4zfmXb1f3BL7+nu33ys2529Zu3DPeA+8j7Nc/fiXGXN5Y6FhVVvWQsDecXzuHK6XnRL4+9P1y1AZg6pV7ZpPSFWuQ8xSFM57wXfq4ALNIJDhEBHMzKW1po+va2irOns21RVQRJiAVgmqnkHPYYAQ0Fkbd87I781D9jMpvj1vfkfLRe1kuncMsbhzFoYLEFkE9PwTI+Q6PCfJRoAAAA=",
  },
  {
    id: "trainer-3",
    name: "Trainer 3",
    avatarUrl:
      "data:image/webp;base64,UklGRg4EAABXRUJQVlA4IAIEAABQEwCdASo0ADQAPlEij0UjoiEWCVzMOAUEtIAJ6b/MeFvhr8nyamAD1F/jf2k/GcNu8Q/l3+Y/KLgYgAdUFqTK3FADxOdBf1Z7B/65f7AV3+Hmnb3yORU9S3U9O1Ragv0Qiy83sTivnyAE8ROD/C+P9FfYtkQ/hErNrL+HiD/mIhdjQrRyg6kSdKQjaJ3GHnxs7r4EEn+nb6e5z0hU23jPH2AAAP7+j0edQObk/1tTSAv76IRGSfJ9miR7mHH3w8Cw0iv2j5zFN87YHZ0b5h+Md+/1rGyEvoxhDJfL+615/WqTOvYsiOpNVIPR5hKQM1WH0Teqf3VFrdkG1PkdI2wunMa7/63UmCG7tmLvPm/q+8PU3La4DmH3OgRdbSyBx5xCsZbUwvS8inAIAyGW5edwSLLj+bCoQj0YQjr55OPRvUe/VDiezBOcMBvkjGbg5eNT82kcDILDyOkzr7Vz36e6xXb5J0D4E5Xse4e91FozZNXW4PkSzunUM89RHhc/ZL0Y6rvmBcQ2VahkYZ7PNNO0l0B6qfvb8PL98X0KSLz2cVtcWag9duUgf5S8EbcaTL9QXIbc+2+Ml2oQWR5WKDYJk4uJB3/2Ttk2oQLWle2cJX4EidcIcSjDf0gClFYJ1CpgV5cUbUheSjHSyM+zsO4lT0Lps9FyL971HDRrjn5b3FNbi9aUdgfHRI8v3LKUB1wuvVnMziYz0hY72dVocRUExUrXiGPKgZvSLFf8DDcoit+XLCPaTnOzTdIQunz65d6Ygis5x1BVnJ9Njj5QhqOCojgAkKX7r7AkiV8sG2R+gOANlo8if1a3W3dVfs/y4v4ZPQuNKH+Ga8PI82FQ/Xx5rgTvMt5OsXwqTag3Ivm7Qtf1X44VbnkAegkQ5uFvd7uuf3XQO9Tz7Nf+VTy2+8NocTqb+NWhC1MQxUpJHstkLQDg3bfSG/oP/mdoHlsqkF5uItOO5+37GWaintNzU5okhep+T099Bt3cfro+1kR362lhICFdDi90t1Udff17SsBm606xlIc0r/1QkWwhVi80SZlApy/5w8nnwHadTHNUJbpSJN+oxxMTV+7/gFhxAbkFHHyV7pJ4oL7pbByo8EgTIKQhg5qC+9bDLabLec/nMX1vd10B5Qpn0sCFU8mBrgjMGOt/dJDuUJyJIQGOYjyNDF/3WQKnZY/2f3S13u7OFNkQvw36Leabm38dYFgDDEMKWLmllJdS9ffaHd/sohaWSFLzG5wy+UTdxWlwan1yaeeVp6LgdB5LEUoKphypc/B5BvmHJRXTefBg/UlJOV0SYD//v7sNRDfdbIThrvRlTJCckqe8HbqtkkXo+9kIKqo5Agm3gTGYoac5fChHAuAAAAA=",
  },
  {
    id: "trainer-4",
    name: "Trainer 4",
    avatarUrl:
      "data:image/webp;base64,UklGRvIDAABXRUJQVlA4IOYDAACQEwCdASozADQAPlEijESjoiEYCwQAOAUEtIAJ8B+7+FPi/9O+1vJx5p7Rf5Xym74dq3/Eb1mADdI7kLjgI+PRX0JvU//Y9wz9Y/9v+ZwSv97Oednz6ks5p1W1jkeDd4gk/sRxJkMAxmmbe7XrI1rc2KcH72FI9HDZP0U8W5hAKgEwRoEXFSxeO6rXc29W4ABkq+cRjvpJF33C/kiFejmllWtZ2AAA/v5ZinwaZdSJzEqm9Tdf22z3Jnx0j9iN73EztSidWnniC+Mo8LreuJzYavHRKJ/bP2NkUrt23rMtKb09MYbDTYiqdS6mNiqDH8TzAzpy+gb9eoQuwqPrA+jF9qgqY4BTol+5mCWfXH7KwvQZqmp1AuSK588q76ZjjTBw7A591qK8+DYGP9pVCYsjG0j4ItqX4HV27DSXqmjovTRJu/S4ux9+JDIaNXdCUQJRhlDXZyUiuVAZ78KoFTpVPqZJ8he5EAKeCU5A8hahpabN1XjyzrqbQxWPBDA81vh+0dRzhgaXfVdIv+HYjZOP4AISLx8v9dZ49x2qwRo5K7fbql/f3A/3sf2/RM4y4FWio3tbPnn8yjRRVFbigngJiqSUvw/H/0q0iWlSVOsf4z4Cu4B0+O9+bnj5lTvfPVdTBd58BTr9kp5TYX7hT4imlggaujucik7qNZLfrgU15qpX3GX0mTzo5FvyugJape+2Aba+EhSvyIU7mdRhZdvtmUyP0nKrnjijPPD67HZUNm0SWu+eqnJstNjC9nrlVOPfI2GMF5EoKYDo43yBZ1ixsYilxH2iSehziu7SGjGbCyQ+Au077lIoIZ1rOfmfrxba8rcTwJpaOP8jHnzRPwjDTBDnYpQjEKhBgv2RrDvrpyL/jm581QizkH/3BvDn95uw176Cm2UVIVYEB8wRliEgEfhtxVyXf645NmtMflqHMyfoqTuhaupLH2Qh+q+mZzLLLrf/Q15Q545XyvUPXh6YXVandmUn5DsFDxASuNte/98Df5uH6k3cvf7yvncSObHKoGzoY2pasvteP+P30F+vtLRCV4nGtVQ8e7yfKpxGEvuWLHwc9rnUp6rKTN+Rx/oA108OeYQrmYAzhd4VwfIPycb7K+Ni6SyGfWjbnvn9WR3FYAPCT+qr4aA++KWVBJCb+usu1NT8CExYnFd0xCH5ugZRSOyWclCsZt9X6bnlZwTSbGP+6RxjbPzn9CTb5ppaz2A0Fuw4aPCUronI39ikHr7Ome0YskFmvp+h0qpW0LlDw6dAHfZVaNQl4lHPhKPyaHFn64Z8OfkQd/bPDc0r2w4lSDTkQ1BcnDzcD0xXGHGPrAAAAA=",
  },
  {
    id: "trainer-5",
    name: "Trainer 5",
    avatarUrl:
      "data:image/webp;base64,UklGRtADAABXRUJQVlA4IMQDAABwEQCdASoyADQAPlEijUUjoiEXCkwAOAUEtIAJ7y+ddGN6azAcgdZn7Q/rOFHa1/x++jwS0zE0ryW/U/ndgsfqxrzHeo1sX+TlVGebmRqR6YkmkqakU/Fm/5I98jBLf86q0Knf31PXcv9c6c9KfHspN7oKgsWlxXs1+PZ7cPx+DP0dL1c6xDb2eRC59rIEYGhu2BTAAP7+c2zw+YoZdADx95+wny/5/8iBchG7hJZJGNEkNr8+43sfnGRu0liRqrX7hJoPvvhWF3oqftp5IdbZdWohMl50qlX6fXsl2GSFXNpLt6R0bbuX4MmN7EUedYas7+kIz2jcaN/58RGUcxaTQhCz2M/vP280thpBICCYbRHibBCpyOL5biqDS9X7o9Qsb1HuTZP3ddMvWVrIdK5QOE1Yvxa5RWiwOrGIdyvS5/1X5bppDR6zK17/ieLyB2pJAG1Ut5RWabc/QzWeuR2zYP80bvsnevLQfYOR05h4nnIlCZ8bPe0T5m+7fHxvSuv44t7hYDRHArwqTmwfwNt1OsrkihEHFk9nY6tOTRAkK+Pmr/PZO39U0vUYn++jVCx33+NqcL6irea5/HJdyrNfgtTPXlkh6MUDCuwebEPqMTxos/iXUWEJHbrwN9co3a/iEb2i/2Tek2hP8RH//PeRg43uYZdQ3pmnBhwA0QEkow4x32jr1SZeeFlum9RsnPXxCrXnnHPZ/Z+VriFvsZUg9z21vUTjBk2vImQnvxe4vVxn6iQ0rL0/BuH0AfPRJC/OJscsCpP8rY4gtnr1QoXhz4DRGrFi68DCw9k+Uf0o1wzNkqFLCwZAx+bw6bxaX4cd53r7KRbdtnLusDrFHerkcujz6/AI0f+ED9/+MW13mOmWlwuhtaB8TYYEN3Yk5aptGVmyXv+y6VfF6AbMEKuz9yWrTyzOcUTb2Ae60Pyq1xl99Jovjus+5wj9iBOo53bbCS3dxW9d2PRl4cSRU/mrI0B0XwA6wBSmbov/m713PAuBcbKgGOnu9PwkvalDL/qWi6IOT7dl37zbFnPctzthg96/FnBCc14zXv82p/sAi3p9Wky6iY3Dv3QW0CqxxqF5ZeQL4GP1O7/HLgVuH0QzCQfVelkj9Vn+zrrml0v6UdwtxRuZWwlmKztm1Y5iTvjLv7fVmR0u9vBPuCNTyd5+DVgV2yXQ1YafhjsCh/MXzXOS3Sf3vVadNuWPMGSGsv+36byZAk6mYc27eGkkZaR1lTd5/3+vel2ewuVGbuJiHh1bq0MIj2GaC9rmN1VVSVO8CAAA",
  },
];

const Y_AXIS_TICKS = [
  { label: "8K", top: 20 },
  { label: "6K", top: 53 },
  { label: "4K", top: 86 },
  { label: "2K", top: 119 },
  { label: "0", top: 152 },
] as const;

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const SparkleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 26 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M13 0C13.3 11.6 16.6 15.65 26 16C16.6 16.35 13.3 20.4 13 32C12.7 20.4 9.4 16.35 0 16C9.4 15.65 12.7 11.6 13 0Z"
      fill="#9AF500"
    />
  </svg>
);

const ActivityRingsIcon: React.FC = () => (
  <svg
    viewBox="0 0 60 60"
    className="w-[54px] h-[54px]"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Concentric move, exercise, and stand activity rings"
  >
    {/* Outer Pink Ring */}
    <circle cx="30" cy="30" r="23" stroke="#2B1119" strokeWidth="6.5" />
    <path
      d="M 30 7 A 23 23 0 1 1 25.5 7.45"
      stroke="#F62064"
      strokeWidth="6.5"
      strokeLinecap="round"
    />
    {/* Middle Lime Ring */}
    <circle cx="30" cy="30" r="16" stroke="#1E260F" strokeWidth="6.5" />
    <path
      d="M 30 14 A 16 16 0 1 1 22.8 15.7"
      stroke="#B6FA04"
      strokeWidth="6.5"
      strokeLinecap="round"
    />
    {/* Inner Cyan Ring */}
    <circle cx="30" cy="30" r="9.2" stroke="#0C2624" strokeWidth="6" />
    <path
      d="M 30 20.8 A 9.2 9.2 0 1 1 25.2 22.1"
      stroke="#06FAE4"
      strokeWidth="6"
      strokeLinecap="round"
    />
  </svg>
);

interface WorkoutBadge {
  id: string;
  label: string;
  offsetX: number;
  offsetY: number;
  icon: React.ReactNode;
}

const WORKOUT_BADGES: WorkoutBadge[] = [
  {
    id: "high-knees",
    label: "High Intensity",
    offsetX: 0,
    offsetY: -43,
    icon: (
      <svg viewBox="0 0 24 24" className="w-[16px] h-[16px]" fill="#111111">
        <circle cx="12" cy="4.5" r="2.1" />
        <path d="M10.5 7.5L13 8l2.5-2.5 1.4 1.3-3.2 3.3-.6 3 3 2.5-.8 4.2-1.9-.3.5-3-2.5-2-2 2.5-.5 3.8-1.9-.2.6-4.5 2.4-2.8.4-3.7-2.2 1.2-.8-1.5 3.4-1.8z" />
      </svg>
    ),
  },
  {
    id: "walk",
    label: "Walking",
    offsetX: -67,
    offsetY: -34.5,
    icon: (
      <svg viewBox="0 0 24 24" className="w-[16px] h-[16px]" fill="#111111">
        <circle cx="13" cy="4.5" r="2.1" />
        <path d="M12.5 7.5l-2 1.2-2.2 3.2 1.5 1 1.6-2.2.8 2.8-2.5 6.8 1.9.6 2-5 1.8 2.2v3.3h1.9v-4l-2-2.8.6-2.6 2.4 1.6.9-1.5-2.8-2-1.6-2.6z" />
      </svg>
    ),
  },
  {
    id: "run",
    label: "Running",
    offsetX: 65.5,
    offsetY: -34.5,
    icon: (
      <svg viewBox="0 0 24 24" className="w-[16px] h-[16px]" fill="#111111">
        <circle cx="13.5" cy="4.5" r="2.1" />
        <path d="M10 8l3-.5 2.5 2.5 2.5-.8.5 1.7-3.4 1.1-1.5-1.4-.9 2.5 2.8 2.4-1.2 4.6-1.9-.5.9-3.4-2.4-2-2.5 2.2-3.2-.5.3-1.9 2.5.4 2.2-2.2.7-2.5-2.2 1-.7-1.5 3.1-1.6z" />
      </svg>
    ),
  },
  {
    id: "core-row",
    label: "Rowing",
    offsetX: -87,
    offsetY: 0,
    icon: (
      <svg viewBox="0 0 24 24" className="w-[16px] h-[16px]" fill="#111111">
        <circle cx="9.5" cy="7" r="1.9" />
        <path d="M9.5 9.5l3 2.5h4.5v1.7h-5.2l-1.8-1.4v3.3h5.8l2 2.2-1.3 1.2-1.6-1.6H8.2v-5.8L9.5 9.5z" />
        <rect x="6" y="18" width="12" height="1.7" rx="0.85" />
      </svg>
    ),
  },
  {
    id: "dance",
    label: "Dance",
    offsetX: -48,
    offsetY: 0,
    icon: (
      <svg viewBox="0 0 24 24" className="w-[16px] h-[16px]" fill="#111111">
        <circle cx="12" cy="5.5" r="1.9" />
        <path d="M11 8L8.5 3.5 7 4.3 9.8 9.2l.4 4.2-2.7 6.3 1.8.7 2.2-5 2.4 5 1.8-.7-2.6-6.2.3-3.2 2.8 2.2 1-1.4L13.5 8H11z" />
      </svg>
    ),
  },
  {
    id: "cycling",
    label: "Cycling",
    offsetX: 46,
    offsetY: 0,
    icon: (
      <svg viewBox="0 0 24 24" className="w-[16px] h-[16px]" fill="#111111">
        <circle cx="13" cy="5" r="1.9" />
        <path d="M12.2 7.5l-3 2.6 2.4 2.8-1.8 4h2l1.4-3.3 2.3-1.4-1.2-2.2 2.8.8.4-1.6-3.8-1.2-1.5-.5z" />
        <path
          d="M7 18.5h10M9 18.5l2-3.5m4 3.5l-1.5-3.5"
          stroke="#111111"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "yoga",
    label: "Yoga",
    offsetX: 85,
    offsetY: 0,
    icon: (
      <svg viewBox="0 0 24 24" className="w-[16px] h-[16px]" fill="#111111">
        <circle cx="11.5" cy="5.5" r="1.9" />
        <path d="M11 8l-3.5-1.5-.6 1.5 3.3 1.4v4.2l-1.5 6.4h1.9l1.2-5.4 5.5-2.1-.6-1.6-4.2 1.6V9.2l4.5-.8-.3-1.6L11 8z" />
      </svg>
    ),
  },
  {
    id: "plank",
    label: "Core",
    offsetX: -67,
    offsetY: 36,
    icon: (
      <svg viewBox="0 0 24 24" className="w-[16px] h-[16px]" fill="#111111">
        <circle cx="16.5" cy="9.5" r="1.8" />
        <path d="M5 14.5l9.5-2.5 2.5 2.5h-1.8l-1.3-1.2-4.8 1.4 1.5 2.8H8.8l-1.3-2.3-2 .6-.5-1.3z" />
      </svg>
    ),
  },
  {
    id: "lunge",
    label: "Strength",
    offsetX: 0,
    offsetY: 42.5,
    icon: (
      <svg viewBox="0 0 24 24" className="w-[16px] h-[16px]" fill="#111111">
        <circle cx="12" cy="4.8" r="2" />
        <path d="M11.2 7.5l-2.5 2.2 1 1.3 1.6-1.3v3.8l-3.2 2.4v4.1h1.9v-3.2l2.1-1.5 2.2 1.8-.4 2.9h1.9l.6-3.7-3-2.5V9.5l2.2 1.5.9-1.4-2.8-2.1h-2.5z" />
      </svg>
    ),
  },
  {
    id: "stretch",
    label: "Cooldown",
    offsetX: 65.5,
    offsetY: 36,
    icon: (
      <svg viewBox="0 0 24 24" className="w-[16px] h-[16px]" fill="#111111">
        <circle cx="10.5" cy="5.5" r="1.9" />
        <path d="M11 8c2.2 0 3.8 1.6 4.2 4l-1.6.4c-.3-1.5-1.1-2.5-2.4-2.6l-.8 3.6 2.8 6.4h-1.9l-2.2-5-2.2 5H5l2.7-6.5L8.7 9c.5-.6 1.3-1 2.3-1z" />
      </svg>
    ),
  },
];

export const FitnessBentoGrid: React.FC<FitnessBentoGridProps> = ({
  metricHeadline = "67K",
  activityFilterLabel = "ACTIVITY",
  usersBadgeLabel = "USERS",
  statsFilterLabel = "LAST 28 DAYS",
  monthlyStats = DEFAULT_MONTHLY_STATS,
  trainers = DEFAULT_TRAINERS,
  onActivityFilterClick,
  onStatsFilterClick,
  className,
  ...props
}) => {
  const rawId = useId();
  const glowFilterId = `neon-line-glow-${rawId.replace(/:/g, "")}`;

  const maxStatValue =
    monthlyStats.length > 0
      ? Math.max(...monthlyStats.map((item) => item.value), 1)
      : 115;

  return (
    <div
      className={cn(
        "min-h-screen w-full bg-[#020202] dark:bg-[#020202] flex items-center justify-center p-4 sm:p-[18px]",
        "font-['Satoshi',-apple-system,BlinkMacSystemFont,'Inter',sans-serif] antialiased",
        "[font-feature-settings:'ss01','cv02'] selection:bg-[#9AF500] selection:text-black",
        className
      )}
      {...props}
    >
      <style>{`@import url("https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap");`}</style>
      <div className="w-full max-w-[730px] flex flex-col gap-[12px]">
        {/* Top Hero Bento Card */}
        <section
          aria-label="Fitness goals and live metrics"
          className="relative w-full min-h-[276px] bg-[#121212] dark:bg-[#121212] rounded-[16px] overflow-hidden flex flex-col md:flex-row items-center justify-between"
        >
          {/* Left Copy Column */}
          <div className="w-full md:w-[430px] px-7 py-8 md:py-0 md:pl-[52px] md:pr-[20px] flex flex-col items-center justify-center text-center z-10">
            <h2 className="text-[25px] font-bold leading-[1.16] tracking-[-0.025em] text-[#F5F5F5] dark:text-[#F5F5F5]">
              Track fitness goals
              <br />
              with on screen metrics
              <br />
              &amp; move ring
            </h2>
            <p className="mt-[13px] max-w-[325px] text-[12.5px] font-normal leading-[1.48] tracking-[-0.005em] text-[#8E8E93] dark:text-[#8E8E93]">
              Sync your watch data with workout videos for on-screen metrics,
              including heart rate visualization.
            </p>
          </div>

          {/* Right Embedded Metrics Chart Card */}
          <div
            className="relative w-full md:w-[300px] h-[244px] md:mt-[32px] self-end rounded-tl-[16px] overflow-hidden shrink-0"
            style={{
              background:
                "linear-gradient(180deg, #212121 0%, #181818 62%, #121212 96%)",
            }}
          >
            {/* Fading top-left inner border */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-tl-[16px] border-t border-l border-white/[0.07] dark:border-white/[0.07]"
              style={{
                maskImage:
                  "linear-gradient(160deg, black 35%, transparent 88%)",
                WebkitMaskImage:
                  "linear-gradient(160deg, black 35%, transparent 88%)",
              }}
            />

            {/* Card Header */}
            <div className="flex items-center justify-between pl-[24px] pr-0 pt-[22px]">
              <span className="text-[28px] font-bold leading-none tracking-[-0.03em] tabular-nums text-white dark:text-white">
                {metricHeadline}
              </span>
              <div className="flex items-center gap-[8px] -mr-[10px]">
                <button
                  type="button"
                  onClick={onActivityFilterClick}
                  aria-label="Filter activity metrics"
                  className="inline-flex items-center gap-[4px] bg-[#161616] dark:bg-[#161616] border border-white/[0.06] dark:border-white/[0.06] rounded-full px-[12px] py-[6px] text-[8.5px] font-bold tracking-[0.08em] text-[#D4D4D4] dark:text-[#D4D4D4] uppercase cursor-pointer transition-colors hover:border-white/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9AF500]/60"
                >
                  <span>{activityFilterLabel}</span>
                  <ChevronDownIcon className="w-[10px] h-[10px] text-[#A3A3A3] dark:text-[#A3A3A3]" />
                </button>
                <span className="inline-flex items-center bg-[#161616] dark:bg-[#161616] border border-white/[0.06] dark:border-white/[0.06] rounded-full px-[12px] py-[6px] text-[8.5px] font-bold tracking-[0.08em] text-[#D4D4D4] dark:text-[#D4D4D4] uppercase">
                  {usersBadgeLabel}
                </span>
              </div>
            </div>

            {/* Y-Axis & Smooth Neon Line Chart */}
            <div className="relative w-full h-[175px] mt-[8px]">
              {/* Gridlines and Y-Axis Labels */}
              {Y_AXIS_TICKS.map((tick) => (
                <div
                  key={tick.label}
                  className="absolute left-[22px] right-0 flex items-center"
                  style={{ top: `${tick.top}px` }}
                >
                  <span className="w-[18px] text-[8px] font-medium tabular-nums text-[#5A5A5C] dark:text-[#5A5A5C] leading-none">
                    {tick.label}
                  </span>
                  <div className="flex-1 h-px bg-white/[0.05] dark:bg-white/[0.05]" />
                </div>
              ))}

              {/* SVG Curve */}
              <svg
                viewBox="0 0 300 175"
                className="absolute inset-0 w-full h-full overflow-visible"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                role="img"
                aria-label="Activity trend line chart peaking near 7K"
              >
                <defs>
                  <filter
                    id={glowFilterId}
                    x="-20%"
                    y="-20%"
                    width="140%"
                    height="140%"
                  >
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <path
                  d="M 45 78 C 54 96, 62 112, 72 107 C 81 102, 86 64, 95 62 C 103 61, 108 94, 117 98 C 123 101, 128 92, 134 99 C 139 105, 142 120, 146 120 C 153 120, 159 77, 166 77 C 174 77, 186 144, 195 144 C 204 144, 214 106, 228 103 C 236 101, 243 100, 250 82 C 256 66, 260 45, 266 45 C 272 45, 277 63, 284 63 C 290 63, 296 48, 300 37"
                  stroke="#9EF600"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter={`url(#${glowFilterId})`}
                />
                {/* Highlighted Data Point */}
                <circle
                  cx="266"
                  cy="45"
                  r="8"
                  fill="#9EF600"
                  fillOpacity="0.22"
                />
                <circle cx="266" cy="45" r="3.4" fill="#B5FF1A" />
              </svg>
            </div>
          </div>
        </section>

        {/* Bottom Two-Column Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-[365px_353px] gap-[12px]">
          {/* Bottom-Left Card: Activity Leaderboards */}
          <section
            aria-label="Activity Leaderboards"
            className="w-full h-[406px] bg-[#121212] dark:bg-[#121212] rounded-[16px] px-[33px] pt-[36px] pb-[36px] flex flex-col items-center"
          >
            <h2 className="text-[24px] font-bold leading-[1.2] tracking-[-0.025em] text-[#F5F5F5] dark:text-[#F5F5F5] text-center">
              Activity Leaderboards
            </h2>
            <p className="mt-[8px] text-[12.5px] font-normal leading-[1.45] tracking-[-0.005em] text-[#8E8E93] dark:text-[#8E8E93] text-center">
              Constant competition for the motivation you need.
            </p>

            {/* Inner Stats Card */}
            <div
              className="mt-[24px] w-full max-w-[298px] h-[244px] rounded-[16px] border border-white/[0.05] dark:border-white/[0.05] px-[24px] pt-[22px] pb-[20px] flex flex-col justify-between"
              style={{
                background:
                  "linear-gradient(180deg, #232323 0%, #1B1B1B 100%)",
              }}
            >
              {/* Stats Header */}
              <div className="flex items-center justify-between">
                <span className="text-[19px] font-medium leading-none tracking-[-0.01em] text-white dark:text-white">
                  Stats
                </span>
                <button
                  type="button"
                  onClick={onStatsFilterClick}
                  aria-label="Select leaderboard stats timeframe"
                  className="inline-flex items-center gap-[5px] bg-[#161616] dark:bg-[#161616] border border-white/[0.06] dark:border-white/[0.06] rounded-full px-[12px] py-[6px] text-[8.5px] font-bold tracking-[0.08em] text-[#D4D4D4] dark:text-[#D4D4D4] uppercase cursor-pointer transition-colors hover:border-white/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9AF500]/60"
                >
                  <span>{statsFilterLabel}</span>
                  <ChevronDownIcon className="w-[10px] h-[10px] text-[#A3A3A3] dark:text-[#A3A3A3]" />
                </button>
              </div>

              {/* Monthly Bar Chart */}
              <div
                role="list"
                aria-label="Monthly activity stats"
                className="flex items-end justify-between gap-[12px] pt-[12px]"
              >
                {monthlyStats.map((item) => {
                  const barHeight = Math.max(
                    8,
                    Math.round((item.value / maxStatValue) * 115)
                  );
                  return (
                    <div
                      key={item.month}
                      role="listitem"
                      aria-label={`${item.month}: ${item.value}`}
                      className="flex flex-col items-center flex-1"
                    >
                      <div
                        className="w-[23px] rounded-t-[4px] rounded-b-[1px]"
                        style={{
                          height: `${barHeight}px`,
                          background: item.highlighted
                            ? "linear-gradient(180deg, #A4FB04 0%, #82D900 100%)"
                            : "linear-gradient(180deg, #4B6E09 0%, #7AC900 100%)",
                        }}
                      />
                      <span className="mt-[10px] text-[8px] font-medium tracking-[0.06em] text-[#5E5E60] dark:text-[#5E5E60] uppercase">
                        {item.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Bottom-Right Column: 3 Stacked Cards */}
          <div className="flex flex-col gap-[12px]">
            {/* Card 1: Multisport workouts */}
            <section
              aria-label="Multisport workouts"
              className="w-full h-[200px] bg-[#121212] dark:bg-[#121212] rounded-[16px] flex flex-col items-center pt-[26px] relative overflow-hidden"
            >
              <h2 className="text-[22px] font-bold leading-[1.2] tracking-[-0.025em] text-[#F5F5F5] dark:text-[#F5F5F5] text-center">
                Multisport workouts
              </h2>

              {/* Concentric Rings + Surrounding Sport Badges */}
              <div className="relative w-full flex-1 flex items-center justify-center">
                <div className="relative w-[220px] h-[120px] flex items-center justify-center">
                  <ActivityRingsIcon />

                  {WORKOUT_BADGES.map((badge) => (
                    <div
                      key={badge.id}
                      title={badge.label}
                      role="img"
                      aria-label={badge.label}
                      className="absolute w-[27px] h-[27px] rounded-full bg-[#A3FA04] flex items-center justify-center"
                      style={{
                        left: `calc(50% + ${badge.offsetX}px - 13.5px)`,
                        top: `calc(50% + ${badge.offsetY}px - 13.5px)`,
                      }}
                    >
                      {badge.icon}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Card 2: Always something new */}
            <section
              aria-label="Always something new"
              className="relative w-full h-[91px] bg-[#121212] dark:bg-[#121212] rounded-[16px] flex items-center justify-center px-6"
            >
              <SparkleIcon className="absolute top-[13px] left-[22px] w-[22px] h-[28px]" />
              <h2 className="text-[22px] font-bold leading-[1.2] tracking-[-0.025em] text-[#F5F5F5] dark:text-[#F5F5F5] text-center">
                Always something new
              </h2>
              <SparkleIcon className="absolute bottom-[9px] right-[22px] w-[23px] h-[29px]" />
            </section>

            {/* Card 3: World's top trainers */}
            <section
              aria-label="World's top trainers"
              className="w-full h-[91px] bg-[#121212] dark:bg-[#121212] rounded-[16px] px-[22px] flex items-center justify-between"
            >
              <h2 className="text-[15px] font-bold leading-[1.2] tracking-[-0.01em] text-[#F5F5F5] dark:text-[#F5F5F5] text-center pl-[6px]">
                World&rsquo;s top
                <br />
                trainers
              </h2>

              <div
                role="list"
                aria-label="Featured trainers"
                className="flex items-center"
              >
                {trainers.map((trainer, index) => (
                  <div
                    key={trainer.id}
                    role="listitem"
                    className={cn(
                      "w-[50px] h-[50px] rounded-full border-[2.5px] border-[#9AF500] overflow-hidden bg-[#E5E5E5] dark:bg-[#E5E5E5] shrink-0",
                      index > 0 && "-ml-[10px]"
                    )}
                  >
                    <img
                      src={trainer.avatarUrl}
                      alt={trainer.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover grayscale"
                    />
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FitnessBentoGrid;
