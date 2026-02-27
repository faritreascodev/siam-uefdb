import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateExtraContactDto } from './dto/create-extra-contact.dto';
import { UpdateExtraContactDto } from './dto/update-extra-contact.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExtraContactsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createExtraContactDto: CreateExtraContactDto) {
    const { applicationId, ...contactData } = createExtraContactDto;

    // Validate application exists
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    // Check limit of 3 contacts
    const count = await this.prisma.extraContact.count({
      where: { applicationId },
    });

    if (count >= 3) {
      throw new BadRequestException('Límite de 3 contactos adicionales alcanzado para este estudiante');
    }

    // Create the extra contact
    return this.prisma.extraContact.create({
      data: {
        applicationId,
        ...contactData,
      },
    });
  }

  async findAllByApplication(applicationId: string) {
    return this.prisma.extraContact.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const contact = await this.prisma.extraContact.findUnique({
      where: { id },
    });

    if (!contact) {
      throw new NotFoundException('Contacto no encontrado');
    }

    return contact;
  }

  async update(id: string, updateExtraContactDto: UpdateExtraContactDto) {
    // Check if exists
    await this.findOne(id);

    return this.prisma.extraContact.update({
      where: { id },
      data: updateExtraContactDto,
    });
  }

  async remove(id: string) {
    // Check if exists
    await this.findOne(id);

    return this.prisma.extraContact.delete({
      where: { id },
    });
  }
}
