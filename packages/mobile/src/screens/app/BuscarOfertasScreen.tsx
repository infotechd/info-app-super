import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Alert } from 'react-native';
import { Searchbar, Card, Text, FAB, Chip } from 'react-native-paper';
import { OfertaServico, OfertaFilters } from '@/types/oferta';
import { ofertaService } from '@/services/ofertaService';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing } from '@/styles/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const BuscarOfertasScreen: React.FC = () => {
    const [ofertas, setOfertas] = useState<OfertaServico[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const { user } = useAuth();
    const canCreateOffer = user?.tipo === 'provider';

    const categories = ['Tecnologia', 'Saúde', 'Educação', 'Beleza', 'Limpeza', 'Consultoria'];

    const loadOfertas = useCallback(async (pageNum = 1, refresh = false) => {
        if (refresh) {
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }

        try {
            const filters: OfertaFilters = {
                busca: searchQuery || undefined,
                categoria: selectedCategory,
            };

            const response = await ofertaService.getOfertas(filters, pageNum, 10);

            const novasOfertas = Array.isArray(response?.ofertas) ? response.ofertas : [];
            const totalPages = typeof response?.totalPages === 'number' ? response.totalPages : 1;

            if (refresh || pageNum === 1) {
                setOfertas(novasOfertas);
            } else {
                setOfertas(prev => [...prev, ...novasOfertas]);
            }

            setHasMore(pageNum < totalPages);
            setPage(pageNum);
        } catch (error: any) {
            Alert.alert('Erro', 'Erro ao carregar ofertas');
            console.error('Erro ao carregar ofertas:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [searchQuery, selectedCategory]);

    useEffect(() => {
        loadOfertas(1, true);
    }, [searchQuery, selectedCategory]);

    const handleRefresh = () => {
        loadOfertas(1, true);
    };

    const handleLoadMore = () => {
        if (!isLoading && hasMore) {
            loadOfertas(page + 1);
        }
    };

    const handleCategoryPress = (category: string) => {
        setSelectedCategory(selectedCategory === category ? undefined : category);
    };

    const renderOferta = ({ item }: { item: OfertaServico }) => {
        // Defensive formatting to avoid runtime crashes from unexpected/null fields
        const preco = typeof item?.preco === 'number' ? item.preco : Number(item?.preco ?? 0);
        const prestadorNome = item?.prestador?.nome ?? 'Prestador';
        const avaliacaoNum = typeof item?.prestador?.avaliacao === 'number' ? item.prestador.avaliacao : Number(item?.prestador?.avaliacao ?? 0);
        const cidade = item?.localizacao?.cidade ?? 'Cidade';
        const estado = item?.localizacao?.estado ?? 'UF';

        return (
            <Card style={styles.card}>
                <Card.Content>
                    <View style={styles.cardHeader}>
                        <Text variant="titleMedium" numberOfLines={2}>{item.titulo}</Text>
                        <Text style={styles.price}>R$ {preco.toFixed(2)}</Text>
                    </View>

                    <Text numberOfLines={3} style={styles.description}>
                        {item.descricao}
                    </Text>

                    <View style={styles.cardFooter}>
                        <View style={styles.providerInfo}>
                            <Icon name="account" size={16} color={colors.textSecondary} />
                            <Text style={styles.providerName}>{prestadorNome}</Text>
                            <Icon name="star" size={16} color={colors.warning} />
                            <Text style={styles.rating}>{avaliacaoNum.toFixed(1)}</Text>
                        </View>

                        <View style={styles.locationInfo}>
                            <Icon name="map-marker" size={16} color={colors.textSecondary} />
                            <Text style={styles.location}>
                                {cidade}, {estado}
                            </Text>
                        </View>
                    </View>

                    <Chip mode="outlined" style={styles.categoryChip}>
                        {item.categoria}
                    </Chip>
                </Card.Content>
            </Card>
        );
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Icon name="store-search" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyText}>Nenhuma oferta encontrada</Text>
            <Text style={styles.emptySubtext}>
                Tente ajustar os filtros ou buscar por outros termos
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <Searchbar
                placeholder="Buscar serviços..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchbar}
                icon="magnify"
            />

            <FlatList
                horizontal
                data={categories}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                    <Chip
                        mode={selectedCategory === item ? 'flat' : 'outlined'}
                        selected={selectedCategory === item}
                        onPress={() => handleCategoryPress(item)}
                        style={styles.categoryFilter}
                    >
                        {item}
                    </Chip>
                )}
                contentContainerStyle={styles.categoriesContainer}
                showsHorizontalScrollIndicator={false}
            />

            <FlatList
                data={ofertas}
                renderItem={renderOferta}
                keyExtractor={(item) => item._id}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
                }
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.1}
                contentContainerStyle={styles.list}
                ListEmptyComponent={!isLoading ? renderEmpty : null}
            />

            {canCreateOffer && (
                <FAB
                    style={styles.fab}
                    icon="plus"
                    label="Criar Oferta"
                    onPress={() => {
                        Alert.alert('Em breve', 'Funcionalidade de criar oferta será implementada');
                    }}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    searchbar: {
        margin: spacing.md,
        marginBottom: spacing.sm,
    },
    categoriesContainer: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.sm,
    },
    categoryFilter: {
        marginRight: spacing.sm,
    },
    list: {
        padding: spacing.md,
        paddingTop: 0,
    },
    card: {
        marginBottom: spacing.md,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.sm,
    },
    price: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.primary,
    },
    description: {
        marginBottom: spacing.sm,
        color: colors.textSecondary,
    },
    cardFooter: {
        marginBottom: spacing.sm,
    },
    providerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    providerName: {
        marginLeft: spacing.xs,
        marginRight: spacing.sm,
        color: colors.text,
    },
    rating: {
        marginLeft: spacing.xs,
        color: colors.text,
    },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    location: {
        marginLeft: spacing.xs,
        color: colors.textSecondary,
        fontSize: 12,
    },
    categoryChip: {
        alignSelf: 'flex-start',
    },
    fab: {
        position: 'absolute',
        margin: spacing.md,
        right: 0,
        bottom: 0,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: spacing.xxl,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
        marginTop: spacing.md,
        marginBottom: spacing.sm,
    },
    emptySubtext: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        paddingHorizontal: spacing.lg,
    },
});

export default BuscarOfertasScreen;