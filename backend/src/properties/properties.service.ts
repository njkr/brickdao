import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { QueryPropertiesDto } from './dto/query-properties.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(query: QueryPropertiesDto) {
    const where: Prisma.PropertyWhereInput = {};

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { location: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.status) where.status = query.status;
    if (query.location)
      where.location = { contains: query.location, mode: 'insensitive' };
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = {
        ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
        ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
      };
    }

    return this.prisma.property.findMany({
      where,
      include: { documents: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: { documents: true },
    });
    if (!property) throw new NotFoundException('Property not found.');
    return property;
  }

  create(dto: CreatePropertyDto) {
    const { documents, ...data } = dto;
    return this.prisma.property.create({
      data: {
        ...data,
        documents: documents?.length ? { create: documents } : undefined,
      },
      include: { documents: true },
    });
  }

  async update(id: string, dto: UpdatePropertyDto) {
    await this.findOne(id);
    const { documents, ...data } = dto;

    return this.prisma.property.update({
      where: { id },
      data: {
        ...data,
        // Full replace keeps this simple and predictable for an admin-only edit form.
        ...(documents
          ? { documents: { deleteMany: {}, create: documents } }
          : {}),
      },
      include: { documents: true },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.property.delete({ where: { id } });
  }
}
