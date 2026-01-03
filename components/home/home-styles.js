import { StyleSheet } from 'react-native';

export function getHomeStyles(theme) {
  return StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    popup: {
      width: '85%',
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
    },
    popupTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 12,
      textAlign: 'center',
    },
    popupText: {
      fontSize: 15,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 22,
    },
    popupButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
      marginHorizontal: 6,
    },
    allowButton: {
      backgroundColor: theme.accent,
    },
    askButton: {
      backgroundColor: theme.secondaryCard,
    },
    askButtonText: {
      color: theme.surfaceText,
      fontWeight: '600',
      fontSize: 15,
    },
    cancelButton: {
      backgroundColor: theme.secondaryCard,
    },
    allowButtonText: {
      color: theme.surfaceText,
      fontWeight: '600',
      fontSize: 15,
    },
    cancelButtonText: {
      color: theme.surfaceText,
      fontWeight: '600',
      fontSize: 15,
    },
    permissionSheet: {
      width: '82%',
      padding: 18,
      borderRadius: 20,
      alignItems: 'center',
      gap: 18,
    },
    permissionHandle: {
      width: 48,
      height: 4,
      borderRadius: 999,
      opacity: 0.5,
    },
    permissionSheetTitle: {
      fontSize: 18,
      fontWeight: '700',
    },
    permissionButtonGroup: {
      width: '100%',
      gap: 10,
    },
    permissionPill: {
      width: '100%',
      paddingVertical: 12,
      borderRadius: 16,
      alignItems: 'center',
    },
    permissionPillPrimary: {},
    permissionPillPrimaryText: {
      color: theme.surfaceText,
      fontWeight: '700',
      fontSize: 15,
    },
    permissionPillSecondary: {
      borderWidth: 1,
    },
    permissionPillSecondaryText: {
      fontWeight: '600',
      fontSize: 15,
    },
    permissionGhostButton: {
      paddingVertical: 6,
    },
    permissionGhostText: {
      fontSize: 14,
      fontWeight: '600',
    },
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 15,
      backgroundColor: 'transparent',
    },
    userName: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    greeting: {
      fontSize: 14,
      marginTop: 4,
    },
    headerIcons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 15,
    },
    iconButton: {
      position: 'relative',
      width: 40,
      height: 40,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chatIconButton: {
      padding: 0,
    },
    chatIconActive: {
      backgroundColor: 'rgba(255,255,255,0.08)',
    },
    chatIndicator: {
      position: 'absolute',
      right: 2,
      top: 2,
      width: 10,
      height: 10,
      borderRadius: 5,
      borderWidth: 2,
      borderColor: theme.background,
    },
    badge: {
      position: 'absolute',
      top: -5,
      right: -8,
      backgroundColor: theme.critical,
      borderRadius: 10,
      width: 18,
      height: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    badgeText: {
      color: theme.surfaceText,
      fontSize: 10,
      fontWeight: 'bold',
    },
    content: {
      flex: 1,
    },
    locationSelector: {
      borderRadius: 16,
      padding: 20,
      marginTop: 20,
      marginBottom: 20,
    },
    locationSelectorTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 16,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    locationInput: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      minHeight: 56,
      flex: 1,
    },
    locationDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 12,
    },
    locationDotSource: {
      backgroundColor: theme.accent,
    },
    locationDotDestination: {
      backgroundColor: theme.critical,
    },
    locationInputContent: {
      flex: 1,
      marginRight: 12,
    },
    locationLabel: {
      fontSize: 12,
      marginBottom: 4,
    },
    locationValue: {
      fontSize: 15,
      fontWeight: '500',
    },
    locationDivider: {
      height: 1,
      marginLeft: 24,
      marginVertical: 4,
    },
    locationActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      alignSelf: 'center',
    },
    locationIconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    locationManualChip: {
      borderWidth: 1,
      borderColor: theme.accent,
      borderRadius: 14,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    locationManualChipText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.accent,
    },
    quickActions: {
      flexDirection: 'column',
      gap: 15,
      marginBottom: 25,
    },
    quickActionCardsRow: {
      flexDirection: 'row',
      gap: 15,
      width: '100%',
    },
    actionCard: {
      flex: 1,
      padding: 20,
      borderRadius: 16,
      minHeight: 140,
      justifyContent: 'center',
      alignItems: 'center',
    },
    primaryAction: {
      backgroundColor: theme.surface,
    },
    secondaryAction: {
      backgroundColor: theme.card,
    },
    quickActionSecondaryRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 12,
      width: '100%',
    },
    quickActionSecondaryButton: {
      flex: 1,
      borderRadius: 14,
      borderWidth: 1,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 52,
    },
    quickActionSecondaryText: {
      fontSize: 14,
      fontWeight: '700',
    },
    actionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginTop: 12,
    },
    actionSubtitle: {
      fontSize: 12,
      marginTop: 4,
    },
    recentSection: {
      marginBottom: 25,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    viewAllText: {
      fontSize: 14,
      fontWeight: '600',
    },
    emptyStateCard: {
      padding: 20,
      borderRadius: 12,
    },
    emptyStateText: {
      textAlign: 'center',
      fontSize: 14,
    },
    emptyStateButton: {
      borderWidth: 1,
      alignItems: 'center',
      gap: 4,
    },
    emptyStateSub: {
      fontSize: 12,
    },
    messagesSection: {
      marginBottom: 25,
      gap: 10,
    },
    messageCard: {
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
    },
    messageCurrentCard: {
      borderWidth: 1,
      borderColor: theme.divider,
    },
    currentChatDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    currentChatLabel: {
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    currentChatHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    messageCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    liveBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 999,
    },
    liveBadgeText: {
      color: theme.background,
      fontSize: 10,
      fontWeight: '700',
    },
    messageName: {
      fontSize: 15,
      fontWeight: '600',
    },
    messageTime: {
      fontSize: 12,
    },
    messageRoute: {
      fontSize: 13,
      marginBottom: 4,
    },
    messagePreview: {
      fontSize: 13,
      fontWeight: '500',
    },
    moreChatsButton: {
      borderWidth: 1,
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: 'center',
    },
    moreChatsText: {
      fontSize: 13,
      fontWeight: '600',
    },
    oldChatsButton: {
      marginTop: 10,
      borderRadius: 999,
      paddingVertical: 12,
      alignItems: 'center',
    },
    oldChatsText: {
      color: theme.surfaceText,
      fontWeight: '700',
      fontSize: 14,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    messagesOverlayScrim: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 1200,
      justifyContent: 'flex-end',
    },
    messagesOverlayBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
    },
    messagesOverlayCard: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 32,
      maxHeight: '70%',
      shadowColor: '#000',
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 10,
    },
    messagesOverlayHandle: {
      width: 48,
      height: 4,
      borderRadius: 999,
      alignSelf: 'center',
      opacity: 0.4,
      marginBottom: 12,
      backgroundColor: theme.divider,
    },
    messagesOverlayHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    emptyOverlayState: {
      paddingVertical: 24,
      paddingHorizontal: 8,
      alignItems: 'center',
      gap: 10,
    },
    emptyOverlayTitle: {
      fontSize: 16,
      fontWeight: '700',
    },
    emptyOverlayText: {
      fontSize: 13,
      textAlign: 'center',
      lineHeight: 18,
    },
    messagesOverlayTitle: {
      fontSize: 18,
      fontWeight: '700',
    },
    messagesOverlayList: {
      marginTop: 6,
    },
    messageListItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.divider,
      gap: 12,
    },
    messageListInfo: {
      flex: 1,
      gap: 4,
    },
    messageListHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    messageListName: {
      fontSize: 15,
      fontWeight: '600',
      marginBottom: 2,
    },
    messageListRoute: {
      fontSize: 12,
    },
    messageListPreviewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    overlayLivePill: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 999,
    },
    overlayLiveText: {
      color: theme.background,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    messageListMeta: {
      fontSize: 12,
      marginBottom: 4,
    },
    messageListPreview: {
      fontSize: 13,
      fontWeight: '500',
    },
    tripCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 15,
      borderRadius: 12,
      marginBottom: 10,
    },
    tripIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    tripInfo: {
      flex: 1,
    },
    tripRoute: {
      fontSize: 14,
      fontWeight: '600',
    },
    tripTime: {
      fontSize: 12,
      marginTop: 4,
    },
    tripStatus: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
    },
    tripStatusText: {
      fontSize: 11,
      color: theme.surfaceText,
      fontWeight: '600',
    },
    manualField: {
      flexDirection: 'column',
      flex: 1,
      gap: 8,
    },
    manualModal: {
      width: '86%',
      borderRadius: 18,
      padding: 18,
      gap: 12,
    },
    manualTitle: {
      fontSize: 16,
      fontWeight: '700',
    },
    manualInput: {
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
    },
    manualError: {
      color: theme.critical,
      fontSize: 12,
      fontWeight: '600',
    },
    manualActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    manualInlineInput: {
      borderWidth: 1,
      borderColor: theme.divider,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
      fontSize: 13,
      width: '100%',
    },
    manualInlineActions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginTop: 6,
      flexWrap: 'wrap',
      gap: 16,
      width: '100%',
    },
    manualInlineButton: {
      paddingHorizontal: 4,
      paddingVertical: 2,
    },
    manualInlineButtonDisabled: {
      opacity: 0.6,
    },
    manualInlineButtonText: {
      color: theme.accent,
      fontWeight: '600',
    },
    manualInlineCancel: {
      paddingHorizontal: 4,
      paddingVertical: 2,
    },
    manualInlineCancelText: {
      color: theme.textSecondary,
      fontSize: 12,
    },
  });
}
