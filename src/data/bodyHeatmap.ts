export type HeatmapView = 'upperFront' | 'upperBack' | 'lowerFront' | 'lowerBack';

export type MuscleRegionId =
  | 'chest'
  | 'frontDelts'
  | 'sideDelts'
  | 'rearDelts'
  | 'traps'
  | 'rotatorCuff'
  | 'lats'
  | 'midBack'
  | 'lowerBack'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'obliques'
  | 'hipFlexors'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'adductors'
  | 'abductorsOuterHip'
  | 'calves';

export interface HeatmapViewDefinition {
  assetPath: string;
  label: string;
}

export const HEATMAP_VIEW_ORDER: readonly HeatmapView[] = [
  'upperFront',
  'upperBack',
  'lowerFront',
  'lowerBack',
];

export const HEATMAP_VIEWS: Record<HeatmapView, HeatmapViewDefinition> = {
  // The two upper-body filenames in the supplied pack describe the opposite
  // visual side. The mapping below follows the anatomy visible in each file.
  upperFront: {
    assetPath: '/anatomy/lineart/02_upper_back_neck_crop.png',
    label: 'Upper body, front',
  },
  upperBack: {
    assetPath: '/anatomy/lineart/01_upper_front_neck_crop.png',
    label: 'Upper body, back',
  },
  lowerFront: {
    assetPath: '/anatomy/lineart/03_lower_front_modest.png',
    label: 'Lower body, front',
  },
  lowerBack: {
    assetPath: '/anatomy/lineart/04_lower_back_modest.png',
    label: 'Lower body, back',
  },
};

export const MUSCLE_ALIASES: Readonly<Record<string, MuscleRegionId>> = {
  chest: 'chest',
  'upper chest': 'chest',
  'front delts': 'frontDelts',
  'side delts': 'sideDelts',
  'rear delts': 'rearDelts',
  'upper traps': 'traps',
  'rotator cuff': 'rotatorCuff',
  lats: 'lats',
  'mid back': 'midBack',
  'back stabilisers': 'lowerBack',
  biceps: 'biceps',
  brachialis: 'biceps',
  triceps: 'triceps',
  forearms: 'forearms',
  'arm stabilisers': 'forearms',
  abdominals: 'abs',
  obliques: 'obliques',
  'hip flexors': 'hipFlexors',
  quadriceps: 'quads',
  hamstrings: 'hamstrings',
  glutes: 'glutes',
  adductors: 'adductors',
  'adductor magnus': 'adductors',
  'adductor longus': 'adductors',
  'adductor brevis': 'adductors',
  gracilis: 'adductors',
  pectineus: 'adductors',
  'gluteus medius': 'abductorsOuterHip',
  'gluteus minimus': 'abductorsOuterHip',
  'tensor fasciae latae': 'abductorsOuterHip',
  'other hip stabilisers': 'abductorsOuterHip',
  calves: 'calves',
};

type RegionPaths = Partial<Record<HeatmapView, readonly string[]>>;

/**
 * The outline of the figure in each drawing. The map fills this shape with a
 * neutral tone first, so a muscle that was not trained reads as part of the
 * body rather than as empty paper, and the trained muscles have something to
 * stand out against.
 */
export const BODY_SILHOUETTES: Readonly<Record<HeatmapView, readonly string[]>> = {
  upperFront: [
    'M552 384 L559 403 L694 403 L701 384 L702 417 L712 431 L841 495 L897 509 L938 549 L962 610 L957 672 L978 738 L982 830 L1008 888 L1022 950 L1023 1001 L1011 1089 L1006 1084 L937 1088 L892 981 L884 932 L884 866 L863 826 L843 763 L808 846 L800 881 L807 947 L801 1008 L823 1083 L430 1083 L452 1009 L446 948 L453 880 L444 843 L410 763 L391 823 L368 870 L368 941 L360 983 L315 1089 L308 1084 L246 1084 L240 1089 L229 1001 L230 950 L245 886 L271 828 L272 755 L296 671 L290 614 L300 577 L325 535 L349 513 L411 495 L542 430 L551 418 Z',
  ],
  upperBack: [
    'M551 346 L558 353 L696 353 L702 346 L703 388 L712 407 L850 487 L908 503 L943 540 L964 592 L960 661 L983 725 L988 821 L1011 873 L1026 933 L1026 989 L1014 1088 L1007 1079 L948 1079 L941 1088 L894 969 L887 928 L886 854 L866 819 L845 761 L797 873 L793 899 L800 958 L796 1001 L822 1082 L430 1082 L456 1003 L453 953 L460 902 L455 871 L408 762 L388 817 L366 856 L360 960 L310 1088 L303 1079 L246 1079 L238 1087 L226 985 L227 930 L239 882 L264 823 L269 728 L293 660 L286 610 L298 562 L319 527 L344 503 L406 486 L543 406 L551 387 Z',
  ],
  lowerFront: [
    'M486 67 L493 91 L539 129 L578 231 L595 260 L627 292 L664 252 L689 206 L715 130 L763 89 L765 67 L801 162 L809 221 L832 288 L842 357 L836 446 L805 560 L806 639 L837 745 L833 808 L798 968 L806 1044 L850 1116 L848 1132 L827 1145 L808 1150 L762 1147 L741 1124 L736 1102 L723 1085 L729 1044 L724 1009 L734 979 L733 936 L687 783 L703 664 L670 545 L660 429 L628 347 L592 439 L584 546 L552 659 L567 786 L544 847 L520 947 L520 976 L531 1014 L526 1037 L531 1086 L519 1101 L512 1126 L488 1149 L443 1149 L422 1143 L405 1129 L409 1105 L448 1044 L447 1018 L457 986 L417 777 L421 720 L449 636 L449 559 L419 449 L412 359 L421 293 L445 222 L450 173 Z',
  ],
  lowerBack: [
    'M770 87 L775 157 L789 183 L816 274 L834 367 L831 469 L799 614 L803 681 L832 748 L837 806 L800 979 L797 1030 L802 1071 L824 1095 L840 1101 L845 1126 L767 1158 L732 1154 L720 1141 L728 1092 L722 1046 L731 1015 L731 979 L714 888 L695 845 L687 802 L703 704 L670 593 L660 518 L624 412 L590 517 L578 601 L546 706 L560 761 L562 808 L557 838 L537 884 L519 976 L519 1018 L527 1041 L522 1095 L530 1139 L515 1155 L467 1155 L442 1140 L407 1130 L404 1113 L412 1099 L425 1095 L447 1072 L453 1026 L448 970 L412 802 L421 736 L447 680 L450 623 L449 590 L418 464 L415 371 L431 282 L461 182 L474 158 L479 92 L765 93 Z',
  ],
};

/**
 * Muscle regions traced from the approved line art in
 * `public/anatomy/lineart`, in the artwork's own 1254 by 1254 coordinate
 * system, so the SVG overlay and the image share one coordinate space.
 * Each outline follows the drawn silhouette and the drawn muscle separations,
 * and stops a few pixels inside the black contour. Bilateral muscles always
 * carry a left and a right path.
 */
export const BODY_HEATMAP_REGIONS: Readonly<Record<MuscleRegionId, RegionPaths>> = {
  chest: {
    upperFront: [
      'M464 497 L576 509 L601 521 L619 539 L627 597 L626 688 L567 729 L536 734 L484 724 L439 706 L406 682 L398 647 L409 596 L455 521 Z',
      'M786 497 L844 596 L855 647 L847 682 L814 706 L769 724 L717 734 L686 729 L627 688 L626 597 L634 539 L652 521 L677 509 L742 505 Z',
    ],
  },
  frontDelts: {
    upperFront: [
      'M422 488 L464 497 L454 523 L412 587 L402 621 L400 654 L371 676 L355 663 L342 635 L338 593 L345 557 L361 525 L387 500 L411 495 Z',
      'M826 488 L866 500 L892 525 L908 557 L915 593 L911 635 L898 663 L882 676 L853 654 L851 621 L841 587 L799 523 L789 497 Z',
    ],
  },
  sideDelts: {
    upperFront: [
      'M389 498 L393 499 L387 500 L361 525 L345 557 L338 593 L342 635 L355 663 L371 676 L339 672 L314 652 L290 624 L295 590 L313 552 L342 518 L364 505 Z',
      'M860 498 L891 506 L912 519 L938 549 L958 592 L963 624 L939 652 L914 672 L882 676 L898 663 L911 635 L915 593 L908 557 L892 525 Z',
    ],
  },
  rearDelts: {
    upperBack: [
      'M461 452 L470 499 L416 555 L404 579 L400 656 L373 678 L341 674 L287 622 L288 592 L305 548 L323 522 L344 503 L364 494 L406 486 Z',
      'M791 452 L850 487 L881 492 L908 503 L929 521 L946 545 L963 587 L965 623 L912 674 L880 678 L853 656 L849 579 L837 555 L783 499 Z',
    ],
  },
  traps: {
    upperBack: [
      'M552 357 L595 378 L624 386 L624 626 L594 624 L584 558 L573 535 L551 514 L489 478 L462 456 L548 404 Z',
      'M700 357 L705 404 L791 456 L764 478 L702 514 L680 535 L669 558 L659 624 L629 626 L629 386 L658 378 Z',
    ],
  },
  rotatorCuff: {
    upperBack: [
      'M462 456 L489 478 L551 514 L573 535 L585 562 L594 624 L493 616 L449 604 L404 580 L416 555 L470 499 Z',
      'M790 456 L783 499 L837 555 L849 580 L804 604 L760 616 L659 624 L668 562 L680 535 L702 514 L764 478 Z',
    ],
  },
  lats: {
    upperBack: [
      'M404 580 L451 605 L479 661 L508 741 L540 801 L563 833 L598 867 L564 894 L535 929 L519 985 L515 1025 L519 1079 L430 1082 L438 1047 L456 1003 L453 953 L460 902 L456 874 L410 764 L404 733 L399 680 L390 642 L392 613 Z',
      'M848 580 L861 613 L863 633 L849 733 L832 793 L797 873 L793 899 L800 958 L796 1001 L815 1048 L822 1082 L734 1079 L738 1036 L734 985 L718 929 L689 894 L655 867 L690 833 L713 801 L745 741 L774 661 L802 605 Z',
    ],
  },
  midBack: {
    upperBack: [
      'M450 604 L493 616 L539 620 L593 612 L624 624 L624 878 L597 868 L566 837 L540 801 L508 741 L479 661 Z',
      'M801 604 L774 661 L745 741 L713 801 L687 837 L656 868 L629 878 L629 624 L660 612 L714 620 L760 616 Z',
    ],
  },
  lowerBack: {
    upperBack: [
      'M597 868 L624 878 L624 1079 L519 1079 L515 1036 L519 985 L535 929 L564 894 Z',
      'M654 868 L689 894 L718 929 L734 985 L738 1025 L734 1079 L629 1079 L629 878 Z',
    ],
  },
  biceps: {
    upperFront: [
      'M290 624 L314 652 L339 672 L372 676 L398 650 L408 688 L417 775 L411 763 L405 769 L391 823 L368 875 L315 885 L244 890 L271 828 L274 741 L296 671 Z',
      'M962 624 L957 672 L978 738 L982 830 L1008 890 L938 885 L885 875 L860 818 L847 767 L842 763 L836 775 L845 688 L855 650 L881 676 L914 672 L939 652 Z',
    ],
  },
  triceps: {
    upperBack: [
      'M287 622 L341 674 L373 678 L399 657 L396 667 L410 763 L403 767 L388 817 L367 853 L364 872 L302 888 L239 885 L264 823 L269 728 L293 660 Z',
      'M964 623 L960 661 L983 725 L988 821 L1014 885 L951 888 L889 872 L886 854 L859 802 L850 767 L843 762 L857 667 L854 657 L880 678 L912 674 L937 654 Z',
    ],
  },
  forearms: {
    upperFront: [
      'M364 875 L368 898 L364 968 L349 1014 L324 1061 L315 1089 L308 1084 L246 1084 L240 1089 L229 1001 L229 961 L244 890 L315 885 Z',
      'M885 875 L930 884 L1009 891 L1023 961 L1022 1012 L1011 1089 L1006 1084 L944 1084 L937 1088 L929 1062 L903 1012 L889 969 L884 932 Z',
    ],
  },
  abs: {
    upperFront: [
      'M625 690 L624 1084 L573 1084 L552 1056 L534 992 L526 910 L529 870 L566 729 L589 718 Z',
      'M627 690 L664 718 L687 729 L724 870 L727 910 L719 992 L701 1056 L680 1084 L629 1084 Z',
    ],
  },
  obliques: {
    upperFront: [
      'M422 692 L439 706 L488 725 L537 734 L566 729 L530 864 L526 910 L532 981 L541 1022 L552 1056 L573 1084 L430 1083 L452 1009 L446 948 L453 910 L453 880 L444 843 L417 778 L412 722 Z',
      'M830 692 L841 722 L836 779 L808 846 L800 881 L807 947 L801 1008 L823 1083 L680 1084 L701 1056 L712 1022 L721 981 L727 910 L723 864 L687 729 L716 734 L765 725 L814 706 Z',
    ],
  },
  hipFlexors: {
    lowerFront: [
      'M507 103 L539 129 L565 205 L590 252 L565 252 L532 220 Z',
      'M745 104 L721 220 L688 252 L664 252 L689 206 L703 155 L715 130 Z',
    ],
  },
  quads: {
    lowerFront: [
      'M490 86 L507 103 L513 122 L532 217 L545 316 L534 423 L518 498 L514 563 L525 620 L547 629 L521 650 L467 658 L443 654 L449 636 L449 559 L421 459 L414 416 L436 396 L456 336 L483 183 Z',
      'M762 89 L770 183 L797 336 L817 396 L840 419 L832 465 L805 560 L805 633 L811 653 L786 658 L732 650 L706 629 L728 620 L739 563 L735 498 L719 423 L708 316 L721 217 L740 122 L746 104 Z',
    ],
  },
  hamstrings: {
    lowerBack: [
      'M423 316 L456 339 L555 378 L584 370 L607 357 L624 358 L618 422 L588 519 L581 572 L554 672 L498 682 L447 670 L450 596 L427 514 L415 434 L415 371 Z',
      'M826 318 L834 367 L834 438 L825 503 L800 594 L803 670 L755 682 L699 672 L672 572 L665 519 L635 422 L629 358 L646 357 L669 370 L698 378 L797 339 Z',
    ],
  },
  glutes: {
    lowerBack: [
      'M481 91 L624 93 L624 358 L607 357 L584 370 L555 378 L456 339 L423 316 L457 194 L474 158 Z',
      'M770 87 L775 157 L791 189 L826 319 L797 339 L698 378 L669 370 L646 357 L629 358 L629 93 L765 93 Z',
    ],
  },
  adductors: {
    lowerFront: [
      'M532 220 L565 252 L591 252 L626 290 L624 332 L592 439 L585 523 L576 572 L554 646 L548 646 L525 621 L514 563 L518 497 L534 422 L545 325 Z',
      'M720 220 L708 325 L719 422 L735 497 L739 563 L728 621 L705 646 L699 646 L677 572 L668 523 L663 443 L629 332 L627 292 L663 252 L688 252 Z',
    ],
  },
  abductorsOuterHip: {
    lowerFront: [
      'M486 67 L490 67 L490 90 L483 183 L456 336 L436 396 L414 414 L412 359 L421 293 L445 222 L453 162 L474 112 Z',
      'M765 67 L769 69 L782 117 L801 162 L809 221 L832 288 L842 357 L840 414 L817 396 L797 336 L770 183 Z',
    ],
  },
  calves: {
    lowerBack: [
      'M440 692 L497 702 L550 692 L546 707 L561 768 L561 817 L552 853 L537 884 L509 1005 L469 1010 L452 1000 L412 802 L418 747 Z',
      'M703 692 L751 702 L810 693 L832 748 L837 777 L833 837 L798 999 L784 1010 L741 1004 L714 888 L697 851 L688 773 L703 709 Z',
    ],
  },
};
